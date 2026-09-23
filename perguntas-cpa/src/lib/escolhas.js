import { EIXO_DA_DIM } from './model.js'

// Todas as perguntas que podem receber decisão (propostas + outras abas)
export const decidiveis = (model) => [...model.propostas, ...model.outras.flatMap((o) => o.perguntas)]

const quem = (s) => s.nome || s.email || 'avaliadora'

// Perguntas marcadas "Entra" em um conjunto de seleções.
// modo: 'uma' (a seleção única passada), 'consenso' (todas marcaram Entra), 'uniao' (ao menos uma)
// Cada item traz: votos, notas e versoes (redações sugeridas — o texto original fica em q.text).
export function escolhidasDe(model, selecoes, modo = 'uma') {
  const n = selecoes.length
  const out = []
  for (const q of decidiveis(model)) {
    const sims = selecoes.filter((s) => s.decisoes?.[q.id]?.status === 'sim')
    const ok = modo === 'consenso' ? n > 0 && sims.length === n : sims.length > 0
    if (!ok) continue
    const notas = selecoes.map((s) => ({ quem: quem(s), nota: s.decisoes?.[q.id]?.nota })).filter((x) => x.nota)
    const versoes = selecoes.map((s) => ({ quem: quem(s), texto: s.decisoes?.[q.id]?.texto })).filter((x) => x.texto)
    out.push({ ...q, votos: sims.length, notas, versoes })
  }
  if (modo !== 'consenso' || n === 1) {
    for (const s of selecoes) {
      for (const g of s.sugestoes || []) {
        if ((g.status || 'sim') !== 'sim') continue
        out.push({
          id: g.id,
          fonte: 'sugestao',
          aba: 'Criada por ' + quem(s),
          text: g.text,
          tipo: g.tipo,
          dim: g.dim,
          eixo: EIXO_DA_DIM[g.dim],
          votos: 1,
          notas: g.nota ? [{ quem: quem(s), nota: g.nota }] : [],
          versoes: [],
        })
      }
    }
  }
  return out
}

// Todas as perguntas criadas pelas avaliadoras (para a visão consolidada)
export const criadasPor = (selecoes) =>
  selecoes.flatMap((s) => (s.sugestoes || []).map((g) => ({ ...g, quem: quem(s), eixo: EIXO_DA_DIM[g.dim] })))
