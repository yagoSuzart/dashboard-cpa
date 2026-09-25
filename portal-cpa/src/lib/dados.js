// Acesso ao banco. Tudo é lido depois do login e passa pelas regras (RLS) do banco.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE, GLOBAL_SUPERVISOR_ROLES } from './config.js'

export const sb = createClient(SUPABASE.url, SUPABASE.chave, {
  auth: { persistSession: true, detectSessionInUrl: true },
})

// Lê todas as linhas de uma consulta, de 1000 em 1000
async function todas(montar) {
  const PAG = 1000
  let de = 0
  const out = []
  for (;;) {
    const { data, error } = await montar().range(de, de + PAG - 1)
    if (error) throw error
    out.push(...data)
    if (data.length < PAG) return out
    de += PAG
  }
}

export async function entrar(email, senha) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) throw new Error(traduzirErroLogin(error))
}

export async function sair() {
  await sb.auth.signOut()
}

export async function esqueciSenha(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + '/' })
  if (error) throw error
}

export async function trocarSenha(nova) {
  const { error } = await sb.auth.updateUser({ password: nova })
  if (error) throw error
}

function traduzirErroLogin(e) {
  const m = String(e?.message || '')
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(m)) return 'Este e-mail ainda não foi confirmado.'
  return m || 'Não foi possível entrar.'
}

// Perfil de quem entrou + cursos que acompanha (mesmas regras de escopo do sistema atual)
export async function carregarPerfil() {
  const { data: s } = await sb.auth.getSession()
  const user = s.session?.user
  if (!user) return null
  const { data: u, error } = await sb.from('usuarios').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!u) return { semPerfil: true, email: user.email }
  const { data: vinc } = await sb.from('usuario_cursos').select('curso_id').eq('usuario_id', user.id)
  const cursos = (vinc || []).map((v) => v.curso_id)
  let nucleoCursos = []
  if (u.role === 'diretor_nucleo' && u.nucleo) {
    const { data: nc } = await sb.from('nucleos_cursos').select('curso_id').eq('nucleo', u.nucleo)
    nucleoCursos = (nc || []).map((x) => x.curso_id)
  }
  const global = GLOBAL_SUPERVISOR_ROLES.includes(u.role)
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    setor: u.setor_id,
    nucleo: u.nucleo,
    nucleoSetor: u.nucleo_setor,
    cursos,
    nucleoCursos,
    global,
  }
}

// Dados pequenos, carregados uma vez
export async function carregarBase() {
  const [cursos, categorias, setores, setorPerguntas, planos, usuarios, professores, resp, lives] = await Promise.all([
    todas(() => sb.from('cursos').select('id, nome, modalidade').order('id')),
    todas(() => sb.from('curso_categorias').select('curso_id, categoria, nota').order('curso_id')),
    todas(() => sb.from('setores').select('id, nome, nota').order('id')),
    todas(() => sb.from('setor_perguntas').select('setor_id, pergunta, nota').order('setor_id')),
    todas(() =>
      sb
        .from('planos_acao')
        .select('*')
        .order('criado_em', { ascending: false }),
    ),
    todas(() => sb.from('usuarios').select('id, nome, role, setor_id').order('nome')),
    todas(() => sb.from('curso_professores').select('curso_id, nome, disciplina, nota, respondentes').order('curso_id')),
    todas(() => sb.from('curso_respondentes').select('curso_id, respondentes').order('curso_id')),
    todas(() => sb.from('curso_lives_tutoria').select('curso_id, tipo, nota, respondentes').order('curso_id')),
  ])
  const notas = {}
  for (const c of categorias) (notas[c.curso_id] ||= {})[c.categoria] = Number(c.nota)
  // Alunos que responderam e notas de Lives e Tutoria, por curso
  const respondentes = Object.fromEntries(resp.map((r) => [r.curso_id, r.respondentes]))
  const livesTutoria = {}
  for (const l of lives) (livesTutoria[l.curso_id] ||= {})[l.tipo] = { nota: Number(l.nota), respondentes: l.respondentes }
  return { cursos, notas, setores, setorPerguntas, planos, usuarios, professores, respondentes, livesTutoria }
}

export async function carregarTurmas(cursoId) {
  return todas(() => sb.from('curso_turmas').select('turma, categoria, nota').eq('curso_id', cursoId).order('turma'))
}

export async function contarComentarios(filtro = {}) {
  const r = {}
  for (const s of ['good', 'warn', 'bad']) {
    let q = sb.from('comentarios').select('id', { count: 'exact', head: true }).eq('sentimento', s)
    if (filtro.cursos) q = q.in('curso_id', filtro.cursos)
    if (filtro.categoria) q = q.eq('categoria', filtro.categoria)
    const { count, error } = await q
    if (error) throw error
    r[s] = count || 0
  }
  return r
}

export async function buscarComentarios({ cursos, categoria, sentimento, busca, professor, pagina = 0, porPagina = 20 }) {
  let q = sb.from('comentarios').select('id, curso_id, turma, professor, categoria, texto, sentimento', { count: 'exact' })
  if (cursos) q = q.in('curso_id', cursos)
  if (categoria) q = q.eq('categoria', categoria)
  if (sentimento) q = q.eq('sentimento', sentimento)
  if (professor) q = q.eq('professor', professor)
  if (busca) {
    const termos = busca.split(',').map((t) => t.trim()).filter(Boolean)
    if (termos.length) q = q.or(termos.map((t) => `texto.ilike.%${t.replace(/[%,()]/g, ' ')}%`).join(','))
  }
  const { data, count, error } = await q.order('id').range(pagina * porPagina, pagina * porPagina + porPagina - 1)
  if (error) throw error
  return { itens: data, total: count || 0 }
}

// Resultados por pergunta (importados da planilha da CPA)
export async function ciclosImportados() {
  const { data, error } = await sb.from('cpa_importacoes').select('*').eq('status', 'concluida').order('importado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function resultadosGerais(ciclo) {
  return todas(() => sb.from('cpa_resultado_geral').select('*').eq('ciclo', ciclo).order('survey_id').order('pergunta_posicao'))
}

// Nota de cada professor por curso e disciplina (questionário Docente da planilha importada)
export async function resultadosProfessores(ciclo) {
  return todas(() => sb.from('cpa_resultado_professor').select('curso_id, disciplina, professor, n, soma').eq('ciclo', ciclo).order('curso_id').order('professor'))
}

export async function resultadosCursos(ciclo, cursos) {
  return todas(() => {
    let q = sb.from('cpa_resultado_curso').select('*').eq('ciclo', ciclo)
    if (cursos) q = q.in('curso_id', cursos)
    return q.order('survey_id').order('pergunta_posicao').order('curso_id')
  })
}

// Detalhe por turma, disciplina e professor de um curso e questionário
export async function resultadosDetalhe(ciclo, cursoId, surveyId) {
  return todas(() =>
    sb
      .from('cpa_resultados')
      .select('pergunta_posicao, pergunta, escala, turma, disciplina, professor, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, nao_utilizo, n, soma')
      .eq('ciclo', ciclo)
      .eq('curso_id', cursoId)
      .eq('survey_id', surveyId)
      .order('id'),
  )
}
