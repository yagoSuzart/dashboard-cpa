// Acesso e administração: solicitar acesso, primeiro acesso, aprovações e gestão de usuários.
// Mesmas regras do sistema anterior: só o Gestor Técnico (role "admin") aprova, edita, exclui
// e reseta senhas, sempre pelas Edge Functions admin-* (que conferem o papel no servidor).
import { sb } from './dados.js'

// Perfis que a pessoa pode pedir na tela pública (os mesmos do formulário do sistema anterior)
export const PERFIS_SOLICITAVEIS = [
  ['coordenador', 'Coordenador de Curso'],
  ['professor_auxiliar', 'Professor(a) Auxiliar - Coordenador Adjunto'],
  ['diretor_nucleo', 'Diretor(a) de Núcleo'],
  ['pro_reitoria', 'Pró-reitoria Acadêmica'],
  ['diretor_cpa', 'Coordenadora da CPA'],
  ['setor', 'Responsável de Setor (Infraestrutura)'],
  ['diretor_nucleo_setor', 'Gestor(a) de Núcleo de Setores (Facilities)'],
]
export const PERFIS_COM_CURSOS = ['coordenador', 'professor_auxiliar', 'diretor_nucleo']

// Núcleos de setores (constantes do sistema anterior)
export const NUCLEO_SETORES = { facilities: ['limpeza', 'manutencao', 'seguranca'] }
export const NUCLEO_SETOR_LABELS = { facilities: 'Núcleo de Facilities' }

// Catálogo público de cursos e setores. A tela "Solicitar acesso" abre antes do login e as regras
// do banco só liberam as tabelas cursos/setores para quem está logado; por isso o sistema anterior
// trazia essa lista embutida. Aqui tentamos o banco primeiro e usamos esta lista como reserva.
// Formato: [id base, nome, modalidades (E = EAD, P = Presencial, S = Semipresencial)]
const CATALOGO_CURSOS = [
  ['administracao', 'Administração', 'EPS'],
  ['analise_e_desenvolvimento_de_sistemas', 'Análise e Desenvolvimento de Sistemas', 'EPS'],
  ['arquitetura_e_urbanismo', 'Arquitetura e Urbanismo', 'EPS'],
  ['biomedicina', 'Biomedicina', 'EPS'],
  ['ciencia_da_computacao', 'Ciência da Computação', 'P'],
  ['ciencia_de_dados', 'Ciência de Dados', 'E'],
  ['ciencias_contabeis', 'Ciências Contábeis', 'EP'],
  ['computacao_em_nuvem', 'Computação em Nuvem', 'E'],
  ['defesa_cibernetica', 'Defesa Cibernética', 'E'],
  ['design_de_interiores', 'Design de Interiores', 'EPS'],
  ['design_grafico', 'Design Gráfico', 'E'],
  ['direito', 'Direito', 'P'],
  ['educacao_fisica_bacharelado', 'Educação Física (Bacharelado)', 'EPS'],
  ['educacao_fisica_licenciatura', 'Educação Física (Licenciatura)', 'EPS'],
  ['enfermagem', 'Enfermagem', 'P'],
  ['engenharia_civil', 'Engenharia Civil', 'EPS'],
  ['engenharia_de_computacao', 'Engenharia de Computação', 'EPS'],
  ['engenharia_de_producao', 'Engenharia de Produção', 'EPS'],
  ['engenharia_eletrica', 'Engenharia Elétrica', 'EPS'],
  ['estetica_e_cosmetica', 'Estética e Cosmética', 'EPS'],
  ['farmacia', 'Farmácia', 'EPS'],
  ['fisioterapia', 'Fisioterapia', 'EPS'],
  ['gestao_comercial', 'Gestão Comercial', 'E'],
  ['gestao_da_tecnologia_da_informacao', 'Gestão da Tecnologia da Informação', 'EPS'],
  ['gestao_de_recursos_humanos', 'Gestão de Recursos Humanos', 'EPS'],
  ['gestao_de_seguranca_privada', 'Gestão de Segurança Privada', 'E'],
  ['gestao_de_seguranca_publica', 'Gestão de Segurança Pública', 'E'],
  ['gestao_financeira', 'Gestão Financeira', 'EP'],
  ['gestao_publica', 'Gestão Pública', 'E'],
  ['influenciador_digital_creator_digital_influencer', 'Influenciador Digital (Creator Digital Influencer)', 'E'],
  ['inteligencia_artificial', 'Inteligência Artificial', 'P'],
  ['inteligencia_artificial_e_automacao_digital', 'Inteligência Artificial e Automação Digital', 'E'],
  ['logistica', 'Logística', 'EP'],
  ['marketing', 'Marketing', 'EPS'],
  ['marketing_digital', 'Marketing Digital', 'ES'],
  ['nutricao', 'Nutrição', 'EPS'],
  ['odontologia', 'Odontologia', 'P'],
  ['pedagogia', 'Pedagogia', 'EPS'],
  ['processos_gerenciais', 'Processos Gerenciais', 'E'],
  ['psicologia', 'Psicologia', 'P'],
  ['psicopedagogia', 'Psicopedagogia', 'ES'],
  ['radiologia', 'Radiologia', 'EPS'],
  ['servico_social', 'Serviço Social', 'ES'],
  ['sistemas_de_informacao', 'Sistemas de Informação', 'E'],
  ['terapia_ocupacional', 'Terapia Ocupacional', 'ES'],
]
const MOD = { E: 'EAD', P: 'PRESENCIAL', S: 'SEMIPRESENCIAL' }
const SUFIXO = { E: 'ead', P: 'presencial', S: 'semipresencial' }
const CURSOS_RESERVA = CATALOGO_CURSOS.flatMap(([id, nome, ms]) =>
  [...ms].map((m) => ({ id: `${id}__${SUFIXO[m]}`, nome, modalidade: MOD[m] })),
)
const SETORES_RESERVA = [
  { id: 'agiliza', nome: 'Setor Agiliza' },
  { id: 'biblioteca', nome: 'Biblioteca' },
  { id: 'cantina', nome: 'Cantina' },
  { id: 'carreiras', nome: 'Setor de Carreiras' },
  { id: 'limpeza', nome: 'Limpeza' },
  { id: 'manutencao', nome: 'Manutenção' },
  { id: 'nead', nome: 'NEAD / AVA (Ambiente Virtual de Aprendizagem)' },
  { id: 'seguranca', nome: 'Segurança e Portaria' },
  { id: 'ti', nome: 'Tecnologia da Informação (T.I.)' },
]

export async function catalogoPublico() {
  const [c, s] = await Promise.all([
    sb.from('cursos').select('id, nome, modalidade').order('id'),
    sb.from('setores').select('id, nome').order('id'),
  ])
  const cursos = !c.error && c.data?.length ? c.data : CURSOS_RESERVA
  const setores = !s.error && s.data?.length ? s.data : SETORES_RESERVA
  const ord = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.modalidade.localeCompare(b.modalidade)
  return { cursos: [...cursos].sort(ord), setores }
}

// Chama uma Edge Function e devolve a mensagem de erro que ela escreveu (quando houver)
async function chamar(nome, body) {
  const { data, error } = await sb.functions.invoke(nome, { body })
  if (error) {
    let msg = error.message
    try {
      const j = await error.context?.json()
      if (j?.error) msg = j.error
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg || 'erro desconhecido')
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// ---------- solicitar acesso (tela pública) ----------
export async function enviarSolicitacao({ nome, email, senha, setorCargo, perfil, cursos, setorInfra, nucleoSetor }) {
  const registro = {
    nome,
    email,
    senha,
    setor_cargo: setorCargo,
    perfil,
    cursos: PERFIS_COM_CURSOS.includes(perfil) ? cursos : [],
    setor_infra: perfil === 'setor' ? setorInfra : null,
    nucleo_setor: perfil === 'diretor_nucleo_setor' ? nucleoSetor : null,
    status: 'pendente',
  }
  const { error } = await sb.from('solicitacoes_acesso').insert(registro)
  if (error) throw error
}

// ---------- primeiro acesso ----------
// O sistema anterior não compara senhas no navegador: usa a coluna usuarios.primeiro_acesso_ok.
// Ela fica false/nula para quem foi criado com a senha padrão ou teve a senha resetada
// (a Edge Function admin-resetar-senha volta a marcar false) e vira true quando a pessoa escolhe.
export async function precisaPrimeiroAcesso(usuarioId) {
  const { data, error } = await sb.from('usuarios').select('primeiro_acesso_ok').eq('id', usuarioId).maybeSingle()
  if (error || !data) return false
  return !data.primeiro_acesso_ok
}

export async function marcarPrimeiroAcessoOk(usuarioId) {
  const { error } = await sb.from('usuarios').update({ primeiro_acesso_ok: true }).eq('id', usuarioId)
  if (error) throw error
}

export async function definirNovaSenha(usuarioId, nova) {
  const { error } = await sb.auth.updateUser({ password: nova })
  if (error) throw error
  try {
    await marcarPrimeiroAcessoOk(usuarioId)
  } catch (e) {
    console.error(e)
  }
}

// ---------- aprovações (admin) ----------
export async function carregarSolicitacoes() {
  // Nunca busca a coluna "senha": a aprovação lê a senha direto no servidor.
  const { data, error } = await sb
    .from('solicitacoes_acesso')
    .select('id, nome, email, setor_cargo, perfil, cursos, setor_infra, nucleo_setor, status, criado_em')
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}

export async function aprovarSolicitacao(s) {
  return chamar('admin-aprovar-solicitacao', {
    solicitacaoId: s.id,
    perfil: s.perfil,
    cursos: s.cursos || [],
    setorInfra: s.setor_infra,
    nucleoSetor: s.nucleo_setor,
  })
}

export async function recusarSolicitacao(id) {
  const { error } = await sb.from('solicitacoes_acesso').update({ status: 'recusado', senha: null }).eq('id', id)
  if (error) throw error
}

// ---------- usuários (admin) ----------
export async function carregarUsuarios() {
  const [u, v] = await Promise.all([
    sb.from('usuarios').select('id, nome, email, role, setor_id, nucleo, nucleo_setor, primeiro_acesso_ok').order('nome'),
    sb.from('usuario_cursos').select('usuario_id, curso_id'),
  ])
  if (u.error) throw u.error
  if (v.error) throw v.error
  const porUsuario = {}
  for (const x of v.data || []) (porUsuario[x.usuario_id] ||= []).push(x.curso_id)
  return (u.data || []).map((p) => ({ ...p, cursos: porUsuario[p.id] || [] }))
}

export const editarUsuario = (targetUserId, role, cursos) => chamar('admin-editar-usuario', { targetUserId, role, cursos })
export const excluirUsuario = (targetUserId) => chamar('admin-excluir-usuario', { targetUserId })
export const resetarSenha = (targetUserId) => chamar('admin-resetar-senha', { targetUserId })
