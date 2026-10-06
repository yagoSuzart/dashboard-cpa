// Concordância entre o enunciado (prefixo) e a pergunta.
// Ex.: "Qual o seu grau de satisfação com relação" + "ao dinamismo das aulas"
//      "Qual o seu grau de satisfação com:"       + "o dinamismo das aulas"
// O gênero e o número vêm da primeira palavra da pergunta, por regras do português
// (com exceções conhecidas); a pessoa sempre pode trocar o artigo com um clique.

const ARTIGOS = ['o', 'a', 'os', 'as']
const CONTRACAO = { o: 'ao', a: 'à', os: 'aos', as: 'às' }
const DE_CONTRACAO = { ao: 'o', 'à': 'a', aos: 'os', 'às': 'as' }

const FEMININAS = new Set(['higiene', 'estrutura', 'infraestrutura', 'rede', 'redes', 'parte', 'partes', 'fonte', 'fontes', 'saúde', 'sede', 'tarde', 'noite', 'gestão', 'mão', 'imagem', 'imagens', 'sala', 'salas', 'aula', 'aulas', 'lives', 'live', 'internet', 'plataforma', 'biblioteca'])
const MASCULINAS = new Set(['dia', 'dias', 'mapa', 'mapas', 'sistema', 'sistemas', 'problema', 'problemas', 'programa', 'programas', 'tema', 'temas', 'clima', 'idioma', 'planeta', 'cinema', 'esquema', 'portal', 'ambiente', 'suporte', 'transporte', 'horário', 'horários', 'conteúdo', 'conteúdos', 'feedback', 'feedbacks', 'serviço', 'serviços', 'espaço', 'espaços', 'acervo', 'preço', 'preços', 'domínio', 'tempo', 'vínculo', 'site', 'setor', 'curso', 'cursos', 'material', 'materiais', 'estudo', 'estudos', 'exemplo', 'exemplos', 'padrão'])

// Primeira letra em minúscula, sem estragar siglas (TI, AVA, CPA)
const minuscula = (t) => (/^[A-ZÀ-Ú]{2,}\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1))

const limpa = (w) => String(w || '').toLowerCase().replace(/[^a-zà-ú-]/g, '')

// Artigo (o/a/os/as) que combina com a primeira palavra da pergunta
export function inferirArtigo(texto) {
  const w = limpa(String(texto || '').trim().split(/\s+/)[0])
  if (!w) return 'o'
  const plural = /s$/.test(w) && !/(ês|ás|ós|ís|us)$/.test(w) && w !== 'lives'
  let fem
  if (FEMININAS.has(w)) fem = true
  else if (MASCULINAS.has(w)) fem = false
  else fem = /(ção|ções|são|sões|dade|dades|eza|ezas|ura|uras|ência|ências|ância|âncias|gem|gens|ice|ices|ia|ias|a|as)$/.test(w)
  return (fem ? 'a' : 'o') + (plural || w === 'lives' ? 's' : '')
}

// Artigo que a pergunta já traz no começo ('o', 'a', 'os', 'as' ou contraído 'ao', 'à', 'aos', 'às')
export function artigoInicial(texto) {
  const m = String(texto || '').trim().match(/^(o|a|os|as|ao|à|aos|às)\s+/i)
  if (!m) return null
  const a = m[1].toLowerCase()
  return { artigo: DE_CONTRACAO[a] || a, contraido: !!DE_CONTRACAO[a], resto: String(texto).trim().slice(m[0].length) }
}

// Como o enunciado termina: pede "ao/à" (… com relação), "o/a" (… com:) ou já tem o "a" (… com relação a:)
export function estiloDoPrefixo(prefixo) {
  const p = String(prefixo || '').trim().toLowerCase().replace(/[:\s…]+$/, '')
  if (/(com|em) relação a$|quanto a$|referente a$/.test(p)) return 'termina_em_a'
  if (/(com|em) relação$|quanto$|referente$/.test(p)) return 'contracao'
  if (/(com|sobre|para|entre|por)$/.test(p)) return 'artigo'
  if (/ de$/.test(p)) return 'de'
  return 'livre' // "o quanto você:", "De 0 a 10…": a pergunta segue sem artigo
}

// Monta a pergunta no formato que o estilo pede (ex.: "ao dinamismo das aulas")
export function textoNoEstilo(texto, estilo, artigo) {
  const ini = artigoInicial(texto)
  const resto = ini ? ini.resto : String(texto || '').trim()
  const art = artigo || (ini ? ini.artigo : inferirArtigo(resto))
  const corpo = minuscula(resto)
  if (estilo === 'contracao') return `${CONTRACAO[art]} ${corpo}`
  if (estilo === 'artigo') return `${art} ${corpo}`
  if (estilo === 'de') return `${{ o: 'do', a: 'da', os: 'dos', as: 'das' }[art]} ${corpo}`
  return resto
}

// A frase como o aluno lê (enunciado + pergunta), já com a contração quando o enunciado termina em "a"
export function leitura(prefixo, texto) {
  const t = String(texto || '').trim()
  if (!prefixo) return t
  const p = String(prefixo).trim()
  const est = estiloDoPrefixo(p)
  const ini = artigoInicial(t)
  if (est === 'termina_em_a' && ini && !ini.contraido) {
    return `${p.replace(/\s*a\s*:?\s*$/i, '')} ${CONTRACAO[ini.artigo]} ${minuscula(ini.resto)}`
  }
  const base = p.replace(/:\s*$/, '')
  return `${est === 'livre' ? p : base} ${minuscula(t)}`
}

// A pergunta não encaixa no enunciado (ex.: "com relação a:" + "Dinamismo das aulas", sem artigo)
export function naoEncaixa(prefixo, texto) {
  if (!prefixo || !texto) return false
  const est = estiloDoPrefixo(prefixo)
  const ini = artigoInicial(texto)
  if (est === 'termina_em_a') return !ini || ini.contraido
  if (est === 'contracao') return !ini || !ini.contraido
  if (est === 'artigo' || est === 'de') return !ini || ini.contraido
  return false
}

export const ARTIGOS_DO_ESTILO = (estilo) => (estilo === 'contracao' ? ARTIGOS.map((a) => [a, CONTRACAO[a]]) : estilo === 'de' ? ARTIGOS.map((a) => [a, { o: 'do', a: 'da', os: 'dos', as: 'das' }[a]]) : ARTIGOS.map((a) => [a, a]))

// Enunciados sugeridos, já no formato que encaixa com o artigo
export const ENUNCIADOS_QUE_ENCAIXAM = [
  { texto: 'Qual o seu grau de satisfação com relação', estilo: 'contracao', exemplo: 'ao dinamismo das aulas · à biblioteca · aos materiais' },
  { texto: 'Qual o seu grau de satisfação com:', estilo: 'artigo', exemplo: 'o dinamismo das aulas · a biblioteca · os materiais' },
]
