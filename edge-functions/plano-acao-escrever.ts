import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Papéis com acesso amplo a QUALQUER item (mesmo fora do próprio curso/setor).
// comissao_cpa foi removido: na interface esse papel é só leitura (nunca recebe
// botões de ação), então também não deve ter escrita irrestrita aqui.
const PAPEIS_COM_ACESSO_AMPLO = ['admin', 'diretor_cpa', 'pro_reitoria']

// Papéis que podem se autoaprovar ("Já resolvi") em itens que eles mesmos criaram.
const PAPEIS_AUTONOMOS_PLANO = ['diretor_nucleo', 'coordenador', 'setor']

// Campos de conteúdo do plano — só o autor pode alterá-los, e só eles (sem status).
const CAMPOS_CONTEUDO = ['titulo', 'descricao', 'indicador', 'prioridade', 'prazo']

// Campos permitidos numa transição de status. revisado_por/validado_por, mesmo
// quando presentes, são sempre recalculados a partir de quem está autenticado —
// nunca aceitamos o valor vindo do cliente.
const CAMPOS_TRANSICAO = [
  'status', 'comentario_revisor', 'revisado_em', 'revisado_por',
  'validado_por', 'data_conclusao', 'enviado_coordenador_em',
]

// Estados válidos de "planos_acao.status" — qualquer outro valor é rejeitado
// antes de chegar perto de uma checagem de papel.
const STATUS_VALIDOS = [
  'rascunho', 'enviado', 'aguardando_coordenador', 'aguardando_pro_reitoria',
  'aprovado', 'devolvido', 'concluido',
]

// Única fonte de verdade sobre quem pode mover um item de um status pro outro.
// Espelha exatamente os botões que a interface mostra hoje (ver index.html:
// renderPlanoItemHTML) — qualquer botão novo precisa de uma linha nova aqui.
function podeTransitar(opts: {
  statusAtual: string
  novoStatus: string
  papel: string
  isOwner: boolean
  escopoCoordenador: boolean
}): boolean {
  const { statusAtual, novoStatus, papel, isOwner, escopoCoordenador } = opts

  if (papel === 'admin') return true // Yago: aprova/edita/exclui qualquer coisa, em qualquer etapa

  if (papel === 'pro_reitoria') {
    if (novoStatus === 'aprovado') return true // palavra final: aprova em qualquer etapa e fecha o item
    if (novoStatus === 'devolvido' && ['enviado', 'aguardando_pro_reitoria'].includes(statusAtual)) return true
  }

  if (papel === 'diretor_cpa' && statusAtual === 'enviado') {
    if (novoStatus === 'aguardando_pro_reitoria' || novoStatus === 'devolvido') return true
  }

  if (papel === 'coordenador' && escopoCoordenador) {
    if (statusAtual === 'aguardando_coordenador' && novoStatus === 'enviado') return true // aprova rascunho do auxiliar
    if (statusAtual === 'enviado' && novoStatus === 'aguardando_coordenador') return true // puxa de volta pra revisão
  }

  if (isOwner) {
    if (statusAtual === 'rascunho' && (novoStatus === 'enviado' || novoStatus === 'aguardando_coordenador')) return true
    if (statusAtual === 'devolvido' && novoStatus === 'enviado') return true
    if (statusAtual === 'aprovado' && novoStatus === 'concluido') return true
    if (
      novoStatus === 'concluido' &&
      PAPEIS_AUTONOMOS_PLANO.includes(papel) &&
      ['enviado', 'aguardando_pro_reitoria', 'devolvido'].includes(statusAtual)
    ) {
      return true // "Já resolvi" — autoaprovação de papéis autônomos
    }
  }

  return false
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autenticado.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData?.user) throw new Error('Não foi possível identificar o usuário logado.')
    const callerId = userData.user.id

    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: perfil, error: perfilError } = await adminClient
      .from('usuarios')
      .select('role, setor_id, nome')
      .eq('id', callerId)
      .single()
    if (perfilError || !perfil) throw new Error('Não foi possível identificar o perfil do usuário logado.')

    const body = await req.json()
    const { acao, itemId, patch } = body
    if (!itemId) throw new Error('itemId não informado.')
    if (acao !== 'update' && acao !== 'delete') throw new Error('Ação inválida.')

    const { data: item, error: itemError } = await adminClient
      .from('planos_acao')
      .select('id, usuario_id, curso_id, setor_id, area, status')
      .eq('id', itemId)
      .single()
    if (itemError || !item) throw new Error('Item não encontrado.')

    const isOwner = item.usuario_id === callerId

    let escopoCoordenador = false
    if (perfil.role === 'coordenador' && item.curso_id) {
      const { data: vinculo } = await adminClient
        .from('usuario_cursos')
        .select('curso_id')
        .eq('usuario_id', callerId)
        .eq('curso_id', item.curso_id)
        .maybeSingle()
      escopoCoordenador = !!vinculo
    }

    const escopoSetorProprio = perfil.role === 'setor' && !!item.setor_id && perfil.setor_id === item.setor_id
    const escopoSetorDemanda = perfil.role === 'setor' && !!item.area && perfil.setor_id === item.area

    const autorizado =
      isOwner ||
      PAPEIS_COM_ACESSO_AMPLO.includes(perfil.role) ||
      escopoCoordenador ||
      escopoSetorProprio ||
      escopoSetorDemanda

    if (!autorizado) {
      throw new Error('Você não tem permissão para alterar este item.')
    }

    if (acao === 'delete') {
      const { error: delError } = await adminClient.from('planos_acao').delete().eq('id', itemId)
      if (delError) throw delError
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // acao === 'update'
    if (!patch || typeof patch !== 'object') throw new Error('patch inválido.')
    const chaves = Object.keys(patch)
    if (chaves.length === 0) throw new Error('Nada para atualizar.')

    if ('status' in patch) {
      const chaveInvalida = chaves.find((k) => !CAMPOS_TRANSICAO.includes(k))
      if (chaveInvalida) throw new Error('Campo não permitido nesta operação: ' + chaveInvalida)
      if (!STATUS_VALIDOS.includes(patch.status)) throw new Error('Status inválido.')

      const ok = podeTransitar({
        statusAtual: item.status,
        novoStatus: patch.status,
        papel: perfil.role,
        isOwner,
        escopoCoordenador,
      })
      if (!ok) {
        throw new Error(
          'Você não pode mover este item de "' + item.status + '" para "' + patch.status + '".'
        )
      }

      // Atribuição nunca vem do cliente — só o texto livre (comentario_revisor) é do cliente.
      if ('revisado_por' in patch) {
        const autoaprovacao =
          patch.status === 'concluido' && isOwner && PAPEIS_AUTONOMOS_PLANO.includes(perfil.role)
        patch.revisado_por = perfil.nome + (autoaprovacao ? ' (autoaprovação)' : '')
      }
      if ('validado_por' in patch) {
        patch.validado_por = perfil.nome
      }
    } else if (chaves.length === 1 && chaves[0] === 'atendido_pelo_setor') {
      if (!escopoSetorDemanda) {
        throw new Error('Você não pode marcar este item como atendido.')
      }
    } else {
      const chaveInvalida = chaves.find((k) => !CAMPOS_CONTEUDO.includes(k))
      if (chaveInvalida) throw new Error('Campo não permitido nesta operação: ' + chaveInvalida)
      if (!isOwner) throw new Error('Só o autor do item pode editar o conteúdo.')
    }

    const { error: updError } = await adminClient.from('planos_acao').update(patch).eq('id', itemId)
    if (updError) throw updError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
