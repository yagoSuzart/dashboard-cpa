// CPA do corpo docente e do corpo técnico-administrativo.
// O questionário parte do instrumento anterior (Excelente / Regular / Insuficiente / Inexistente)
// e segue o mesmo formato da CPA dos alunos: prefixo + escala de 1 a 5, com "Não sei / Não se aplica"
// contado à parte (fora da média), um comentário aberto por eixo e a satisfação geral de 0 a 10.
import { sb } from './dados.js'

export const VE_COLAB = ['admin', 'diretor_cpa', 'pro_reitoria']
export const GERE_COLAB = ['admin', 'diretor_cpa']

export const PUBLICOS = {
  docente: { t: 'Corpo docente', curto: 'Docentes', eu: 'Sou professor(a)' },
  tecnico: { t: 'Corpo técnico-administrativo', curto: 'Técnico-administrativos', eu: 'Sou do corpo técnico-administrativo' },
}

export const NAO_SEI = 6
export const MIN_GRUPO = 5 // com menos respostas que isso, o grupo pode ser reconhecido: a tela avisa

const SATISFACAO = 'Qual o seu grau de satisfação com relação a:'
const CONHECIMENTO = 'Qual o seu nível de conhecimento sobre:'

export const ESCALAS_COLAB = {
  satisfacao: { valores: [1, 2, 3, 4, 5], ancoras: ['Muito insatisfeito(a)', 'Muito satisfeito(a)'], na: 'Não sei / Não se aplica' },
  conhecimento: { valores: [1, 2, 3, 4, 5], ancoras: ['Não conheço', 'Conheço muito bem'], na: 'Prefiro não responder' },
  nps: { valores: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ancoras: ['Nada provável', 'Muito provável'] },
}

// p: 'ambos' | 'docente' | 'tecnico'
const q = (id, texto, dim, p = 'ambos') => ({ id, texto, dim, p })

export const BLOCOS = [
  {
    id: 'e1', eixo: 1, titulo: 'Planejamento e Avaliação Institucional',
    grupos: [
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e1_autoavaliacao', 'O processo de autoavaliação institucional (CPA) da UniFECAF', 8),
          q('e1_divulgacao', 'A divulgação dos resultados da CPA para a comunidade acadêmica', 8),
          q('e1_melhorias', 'As melhorias realizadas pela instituição a partir dos resultados da avaliação', 8),
        ],
      },
    ],
  },
  {
    id: 'e2', eixo: 2, titulo: 'Desenvolvimento Institucional',
    grupos: [
      {
        prefixo: CONHECIMENTO, escala: 'conhecimento',
        perguntas: [
          q('e2_missao', 'A missão, a visão e os valores da UniFECAF', 1),
          q('e2_pdi', 'O Plano de Desenvolvimento Institucional (PDI)', 1),
          q('e2_ppc', 'O Projeto Pedagógico (PPC) dos cursos em que você leciona', 1, 'docente'),
          q('e2_cursos', 'Os cursos oferecidos pela UniFECAF e seus diferenciais', 1, 'tecnico'),
        ],
      },
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e2_regiao', 'O impacto do trabalho da UniFECAF no desenvolvimento cultural e socioeconômico da região', 3),
          q('e2_bolsas', 'As políticas de inclusão e de bolsas para estudantes em situação econômica desfavorecida', 3),
          q('e2_convenios', 'Os convênios e parcerias para ensino, estágios, pesquisa e extensão', 3),
          q('e2_social', 'Os projetos de responsabilidade social (Projeto Rapunzel, Doação de Sangue, Natal Solidário, UniFECAF Portas Abertas, entre outros)', 3),
          q('e2_acessibilidade', 'As ações de acessibilidade e inclusão de pessoas com deficiência', 3),
        ],
      },
    ],
  },
  {
    id: 'e3', eixo: 3, titulo: 'Políticas Acadêmicas',
    grupos: [
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e3_grad_pres', 'A oferta de novos cursos de graduação presenciais', 2),
          q('e3_grad_ead', 'A oferta de novos cursos de graduação EAD', 2),
          q('e3_pos_pres', 'A oferta de cursos de pós-graduação presenciais', 2),
          q('e3_pos_ead', 'A oferta de cursos de pós-graduação EAD', 2),
          q('e3_recursos', 'Os recursos e metodologias disponíveis para as suas aulas (plataforma, materiais, laboratórios)', 2, 'docente'),
          q('e3_pesquisa', 'Os incentivos à pesquisa, à extensão e à produção acadêmica', 2, 'docente'),
          q('e3_comunicacao', 'Os canais de comunicação internos e externos (e-mail, grupos de WhatsApp, Instagram, portal, calendários)', 4),
          q('e3_site', 'O site da UniFECAF', 4),
          q('e3_apoio_aluno', 'O atendimento e o apoio oferecidos aos alunos (secretaria, financeiro, apoio psicopedagógico)', 9),
        ],
      },
    ],
  },
  {
    id: 'e4', eixo: 4, titulo: 'Políticas de Gestão',
    grupos: [
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e4_compr_tecnico', 'O comprometimento do corpo técnico-administrativo com a instituição', 5),
          q('e4_compr_docente', 'O comprometimento do corpo docente com a instituição', 5),
          q('e4_capacitacao', 'As oportunidades de capacitação e desenvolvimento profissional', 5),
          q('e4_carreira', 'O plano de carreira e as políticas de valorização profissional', 5),
          q('e4_clima', 'O clima de trabalho', 5),
          q('e4_coordenacao', 'O apoio da coordenação do curso ao seu trabalho', 6, 'docente'),
          q('e4_lideranca', 'O apoio da sua liderança imediata ao seu trabalho', 6, 'tecnico'),
          q('e4_participacao', 'A sua participação nas decisões que afetam o seu trabalho', 6),
          q('e4_reitoria', 'O trabalho da Reitoria', 6),
          q('e4_financeiro', 'O equilíbrio financeiro da instituição', 10),
          q('e4_obrigacoes', 'O cumprimento dos compromissos com os colaboradores (salários e benefícios)', 10),
        ],
      },
    ],
  },
  {
    id: 'e5', eixo: 5, titulo: 'Infraestrutura Física',
    grupos: [
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e5_biblioteca', 'A estrutura física da biblioteca (segurança, mobiliário, ambiente)', 7),
          q('e5_acervo', 'O acervo da biblioteca (livros, revistas e demais materiais)', 7),
          q('e5_salas', 'As salas de aula e os laboratórios', 7, 'docente'),
          q('e5_trabalho', 'Os espaços de trabalho disponibilizados para você', 7),
          q('e5_convivencia', 'Os espaços de convivência', 7),
          q('e5_banheiros', 'Os banheiros e vestiários', 7),
          q('e5_servicos', 'Os serviços de portaria, segurança, manutenção e limpeza', 7),
          q('e5_acessibilidade', 'A acessibilidade das instalações', 7),
        ],
      },
    ],
  },
  {
    id: 'e5t', eixo: 5, titulo: 'Infraestrutura Tecnológica',
    grupos: [
      {
        prefixo: SATISFACAO, escala: 'satisfacao',
        perguntas: [
          q('e5_equipamentos', 'A qualidade e a quantidade dos equipamentos (computadores, chromebooks)', 7),
          q('e5_internet', 'A qualidade da internet (Wi-Fi e rede)', 7),
          q('e5_biblio_virtual', 'A biblioteca virtual', 7),
          q('e5_sistemas', 'Os sistemas institucionais que você usa no trabalho', 7),
          q('e5_ti', 'O atendimento do Departamento de Tecnologia da Informação (TI)', 7),
        ],
      },
    ],
  },
]

// Fechamento: satisfação geral (0 a 10) e duas perguntas abertas
export const FINAL = {
  nps: q('g_recomenda', 'Em uma escala de 0 a 10, o quanto você recomendaria a UniFECAF como um lugar para trabalhar?', 8),
  abertas: [
    { id: 'g_forte', texto: 'O que a UniFECAF faz bem e deve continuar fazendo?' },
    { id: 'g_melhorar', texto: 'O que a UniFECAF mais precisa melhorar?' },
  ],
}

export const comentarioDoBloco = (b) => 'c_' + b.id

// Pergunta aberta de cada seção, como no instrumento anterior
export const TEXTO_COMENTARIO = 'Deixe seu comentário, sugestão ou reclamação.'

// Questionário padrão (ponto de partida de cada período novo). Cada período guarda uma cópia editável.
export const INSTRUMENTO_PADRAO = { blocos: BLOCOS, final: FINAL }
const copia = (x) => JSON.parse(JSON.stringify(x))
export const novoInstrumento = () => copia(INSTRUMENTO_PADRAO)
export const instrumentoDe = (camp) => (camp?.instrumento?.blocos?.length ? camp.instrumento : INSTRUMENTO_PADRAO)

export function blocosDo(inst, publico) {
  return inst.blocos.map((b) => ({
    ...b,
    grupos: b.grupos.map((g) => ({ ...g, perguntas: g.perguntas.filter((x) => x.p === 'ambos' || x.p === publico) })).filter((g) => g.perguntas.length),
  })).filter((b) => b.grupos.length)
}

export function perguntasFechadas(inst, publico) {
  const out = []
  for (const b of inst.blocos) for (const g of b.grupos) for (const x of g.perguntas) if (!publico || x.p === 'ambos' || x.p === publico) out.push({ ...x, bloco: b, prefixo: g.prefixo, escala: g.escala })
  return out
}

// Identificador de pergunta nova (o banco aceita só letras minúsculas, números e _)
export function novoId(prefixo = 'n') {
  return prefixo + '_' + Math.random().toString(36).slice(2, 8)
}

/* ---------------- envio (público, anônimo) ---------------- */
export async function campanhaPublica(codigo) {
  const { data, error } = await sb.rpc('colab_campanha_publica', { p_codigo: codigo })
  if (error) throw error
  return data?.[0] || null
}

export async function enviarAvaliacao(codigo, publico, perfil, notas, abertas) {
  const { error } = await sb.rpc('colab_enviar', { p_codigo: codigo, p_publico: publico, p_perfil: perfil, p_notas: notas, p_abertas: abertas })
  if (error) throw error
}

/* ---------------- gestão e resultados (Portal) ---------------- */
export async function listarCampanhas() {
  const { data, error } = await sb.from('cpa_colab_campanhas').select('*').order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function criarCampanha(titulo, ciclo, fechaEm, usuarioId, instrumento) {
  const { data, error } = await sb.from('cpa_colab_campanhas').insert({ titulo, ciclo, fecha_em: fechaEm || null, criado_por: usuarioId, instrumento: instrumento || novoInstrumento() }).select('*').single()
  if (error) throw error
  return data
}

export async function atualizarCampanha(id, patch) {
  const { data, error } = await sb.from('cpa_colab_campanhas').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function salvarInstrumento(id, instrumento, usuarioId) {
  return atualizarCampanha(id, { instrumento, instrumento_atualizado_por: usuarioId, instrumento_atualizado_em: new Date().toISOString() })
}

export async function contarRespostas(campanhaId) {
  const { count, error } = await sb.from('cpa_colab_respostas').select('id', { count: 'exact', head: true }).eq('campanha_id', campanhaId)
  if (error) throw error
  return count || 0
}

export async function carregarRespostas(campanhaId) {
  const out = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from('cpa_colab_respostas').select('id, publico, perfil, notas, abertas, criado_em').eq('campanha_id', campanhaId).order('criado_em').range(de, de + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

export function linkDaCampanha(c) {
  return `${location.origin}/#/avaliar/${c.codigo}`
}

// Média de 1 a 5 (sem o "Não sei") e distribuição de uma pergunta
export function resumoPergunta(respostas, id, nps = false) {
  const dist = {}
  let n = 0, soma = 0, na = 0
  for (const r of respostas) {
    const v = r.notas?.[id]
    if (v == null) continue
    if (!nps && v === NAO_SEI) { na++; continue }
    dist[v] = (dist[v] || 0) + 1
    n++
    soma += v
  }
  return { n, na, media: n ? soma / n : null, dist }
}

export function mediaDeGrupo(respostas, perguntas) {
  let n = 0, soma = 0
  for (const p of perguntas) {
    const r = resumoPergunta(respostas, p.id)
    n += r.n
    soma += (r.media || 0) * r.n
  }
  return n ? soma / n : null
}

// CSV anônimo para a CPA (uma linha por resposta)
export function csvRespostas(inst, respostas) {
  const fech = perguntasFechadas(inst)
  const abertas = [...inst.blocos.map((b) => ({ id: comentarioDoBloco(b), texto: 'Comentário · ' + b.titulo })), ...inst.final.abertas]
  const cab = ['publico', 'enviado_em', ...fech.map((p) => p.id), inst.final.nps.id, ...abertas.map((a) => a.id)]
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const linhas = respostas.map((r) => [
    PUBLICOS[r.publico]?.t || r.publico,
    new Date(r.criado_em).toLocaleDateString('pt-BR'),
    ...fech.map((p) => r.notas?.[p.id] ?? ''),
    r.notas?.[inst.final.nps.id] ?? '',
    ...abertas.map((a) => r.abertas?.[a.id] || ''),
  ])
  return '﻿' + [cab, ...linhas].map((l) => l.map(esc).join(';')).join('\n')
}
