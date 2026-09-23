import { EIXO_DA_DIM } from './model.js'

// Todas as perguntas que podem receber decisão (propostas + outras abas)
export const decidiveis = (model) => [...model.propostas, ...model.outras.flatMap((o) => o.perguntas)]

// Perguntas marcadas "Entra" em um conjunto de seleções.
// modo: 'uma' (a seleção única passada), 'consenso' (todas marcaram Entra), 'uniao' (ao menos uma)
export function escolhidasDe(model, selecoes, modo = 'uma') {
  const base = decidiveis(model)
  const n = selecoes.length
  const out = []
  for (const q of base) {
    const sims = selecoes.filter((s) => s.decisoes?.[q.id]?.status === 'sim')
    const ok = modo === 'consenso' ? n > 0 && sims.length === n : sims.length > 0
    if (!ok) continue
    const notas = selecoes
      .map((s) => ({ quem: s.nome || s.email, nota: s.decisoes?.[q.id]?.nota }))
      .filter((x) => x.nota)
    out.push({ ...q, votos: sims.length, notas })
  }
  for (const s of selecoes) {
    for (const g of s.sugestoes || []) {
      if (modo === 'consenso' && n > 1) continue
      out.push({
        id: g.id,
        fonte: 'sugestao',
        aba: 'Sugestão de ' + (s.nome || s.email || 'avaliadora'),
        text: g.text,
        dim: g.dim,
        eixo: EIXO_DA_DIM[g.dim],
        votos: 1,
        notas: g.nota ? [{ quem: s.nome || s.email, nota: g.nota }] : [],
      })
    }
  }
  return out
}
