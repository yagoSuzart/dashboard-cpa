// Texto das perguntas como o aluno de cada modalidade lê, para a página pública das perguntas da próxima CPA.
// Mesma regra de textoNaModalidade/prefixoDe (lib/proxima.js), sem puxar o cliente do banco nem o login:
// a página pública fica separada do Portal.
import instrumento from '../data/instrumento-atual.json'

const VARIANTES = Object.fromEntries(instrumento.perguntas.map((p) => [p.id, p.variantes || {}]))
const PREFIXOS = instrumento.prefixos || {}

// Pergunta atual que não foi reescrita: mantém a variação de hoje daquela modalidade
export function textoNaModalidade(item, mod) {
  if (item.origem === 'atual' && item.texto === item.texto_original) {
    const v = VARIANTES[item.atual_id]?.[mod]
    if (v) return v
  }
  return item.texto
}

// Enunciado do questionário naquela modalidade (o da proposta, se a CPA mudou; senão o de hoje)
export function prefixoDe(prefixos, qid, mod) {
  const r = (prefixos || []).find((x) => x.questionario_id === qid && x.modalidade === mod)
  if (r) return r.texto || ''
  const p = PREFIXOS[qid]
  return p ? p[mod] || Object.values(p)[0] || '' : ''
}
