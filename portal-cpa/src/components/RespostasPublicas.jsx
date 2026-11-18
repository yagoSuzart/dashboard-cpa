// Página aberta: como os alunos estão avaliando a UniFECAF na CPA em andamento. Distribuição das notas de cada pergunta,
// somada por modelo de oferta e questionário (sem curso, sem professor, sem comentário), a partir dos CSVs de Respostas
// que a CPA publica.
import { useMemo, useState } from 'react'
import { MODALIDADES_AO_VIVO, fmtNum } from '../lib/aoVivo.js'

const LIKERT = [
  { v: '1', t: 'Muito insatisfeito', cor: '#d95926', txt: '#fff' },
  { v: '2', t: 'Insatisfeito', cor: '#f0a777', txt: '#1a1206' },
  { v: '3', t: 'Neutro', cor: '#55627f', txt: '#fff' },
  { v: '4', t: 'Satisfeito', cor: '#8ab8ee', txt: '#0b1630' },
  { v: '5', t: 'Muito satisfeito', cor: '#3987e5', txt: '#fff' },
  { v: '6', t: 'Não sei', cor: '#26324f', txt: '#a9b6cc' },
]
const NPS = [
  { t: 'Detratores (0 a 6)', cor: '#d95926', txt: '#fff', de: 0, ate: 6 },
  { t: 'Neutros (7 e 8)', cor: '#55627f', txt: '#fff', de: 7, ate: 8 },
  { t: 'Promotores (9 e 10)', cor: '#3987e5', txt: '#fff', de: 9, ate: 10 },
]
const VER = 4
const nota = (v) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const pc = (v) => Math.round(v) + '%'
const corNota = (v) => (v >= 4.3 ? '#8be36a' : v >= 4 ? '#b7f19c' : v >= 3.5 ? '#f0a33a' : '#ff8a5c')

function calcular(q) {
  const dist = q.dist || {}
  if (q.escala === 'nps_0_10') {
    const fx = NPS.map((f) => Object.entries(dist).reduce((s, [v, c]) => (Number(v) >= f.de && Number(v) <= f.ate ? s + c : s), 0))
    const tot = fx.reduce((s, c) => s + c, 0)
    const soma = Object.entries(dist).reduce((s, [v, c]) => s + Number(v) * c, 0)
    return { tot, partes: NPS.map((f, i) => ({ ...f, n: fx[i] })), nps: tot ? Math.round(((fx[2] - fx[0]) / tot) * 100) : null, media: tot ? soma / tot : null }
  }
  const tot = LIKERT.reduce((s, f) => s + (dist[f.v] || 0), 0)
  let soma = 0, n = 0
  for (const f of LIKERT.slice(0, 5)) { soma += Number(f.v) * (dist[f.v] || 0); n += dist[f.v] || 0 }
  return { tot, partes: LIKERT.map((f) => ({ ...f, n: dist[f.v] || 0 })), media: n ? soma / n : null, validas: n }
}

function Barra({ c }) {
  return (
    <div className="rpp-barra" role="img" aria-label={c.partes.map((p) => `${p.t}: ${pc((p.n / (c.tot || 1)) * 100)}`).join('; ')}>
      {c.partes.map((p) => p.n > 0 && (
        <i key={p.t} style={{ width: (p.n / c.tot) * 100 + '%', background: p.cor, color: p.txt }} title={`${p.t}: ${fmtNum(p.n)} (${pc((p.n / c.tot) * 100)})`}>
          {p.n / c.tot >= 0.1 ? pc((p.n / c.tot) * 100) : ''}
        </i>
      ))}
    </div>
  )
}

export default function RespostasPublicas({ r }) {
  const mods = MODALIDADES_AO_VIVO.filter((m) => r.perguntas.some((q) => q.modalidade === m.k))
  const [mod, setMod] = useState(mods[0]?.k || '')
  const [aberto, setAberto] = useState({})

  const cards = useMemo(() => {
    const out = new Map()
    for (const q of r.perguntas) {
      if (q.modalidade !== mod) continue
      if (!out.has(q.pesquisa)) out.set(q.pesquisa, { nome: q.pesquisa, perguntas: [] })
      out.get(q.pesquisa).perguntas.push({ ...q, c: calcular(q) })
    }
    const info = Object.fromEntries(r.pesquisas.filter((p) => p.modalidade === mod).map((p) => [p.pesquisa, p]))
    return [...out.values()]
      .map((g) => {
        const lk = g.perguntas.filter((q) => q.escala !== 'nps_0_10' && q.c.media != null)
        const n = lk.reduce((s, q) => s + q.c.validas, 0)
        const nps = g.perguntas.filter((q) => q.escala === 'nps_0_10' && q.c.nps != null)
        return {
          ...g,
          info: info[g.nome],
          media: n ? lk.reduce((s, q) => s + q.c.media * q.c.validas, 0) / n : null,
          nps: nps.length ? Math.round(nps.reduce((s, q) => s + q.c.nps, 0) / nps.length) : null,
          perguntas: g.perguntas.sort((a, b) => a.n - b.n),
        }
      })
      .sort((a, b) => (b.info?.alunos || 0) - (a.info?.alunos || 0))
  }, [r, mod])

  const respostas = cards.reduce((s, g) => s + g.perguntas.reduce((x, q) => x + q.c.tot, 0), 0)

  return (
    <>
      <div className="pp-abas" role="tablist" aria-label="Modelo de oferta">
        {mods.map((m) => <button key={m.k} role="tab" aria-selected={mod === m.k} onClick={() => setMod(m.k)}>{m.t}</button>)}
      </div>
      <p className="pp-mut rpp-resumo">{fmtNum(respostas)} respostas no {mods.find((m) => m.k === mod)?.t} · {cards.length} questionários · atualizado em {new Date(r.publicado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
      <div className="rpp-leg" aria-label="Legenda">
        {LIKERT.map((f) => <span key={f.v}><i style={{ background: f.cor }} />{f.v === '6' ? f.t : `${f.v} · ${f.t}`}</span>)}
      </div>
      <div className="rpp-grid">
        {cards.map((g) => {
          const todas = aberto[mod + g.nome]
          return (
            <article key={g.nome} className="pp-card rpp-card">
              <header>
                <div>
                  <h4>{g.nome}</h4>
                  {g.info && <small>{fmtNum(g.info.concluiram)} alunos concluíram</small>}
                </div>
                {g.media != null ? (
                  <div className="rpp-nota" style={{ color: corNota(g.media) }}>{nota(g.media)}<small>média de 1 a 5</small></div>
                ) : g.nps != null && (
                  <div className="rpp-nota" style={{ color: g.nps >= 50 ? '#8be36a' : g.nps >= 0 ? '#f0a33a' : '#ff8a5c' }}>{g.nps}<small>NPS</small></div>
                )}
              </header>
              {(todas ? g.perguntas : g.perguntas.slice(0, VER)).map((q) => (
                <div key={q.n + q.pergunta} className="rpp-q">
                  <p><span>{q.pergunta}</span><b>{q.escala === 'nps_0_10' ? `NPS ${q.c.nps}` : nota(q.c.media)}</b></p>
                  <Barra c={q.c} />
                </div>
              ))}
              {g.perguntas.length > VER && (
                <button className="pp-mais" onClick={() => setAberto((a) => ({ ...a, [mod + g.nome]: !todas }))}>
                  {todas ? 'Mostrar menos' : `Ver as ${g.perguntas.length} perguntas →`}
                </button>
              )}
            </article>
          )
        })}
      </div>
      <p className="pp-mut rpp-nota-rod">Resultado parcial, somado por modelo de oferta: a avaliação ainda está aberta e os números mudam a cada atualização. Perguntas de 0 a 10 mostram o NPS (% de notas 9 e 10 menos % de notas de 0 a 6). Comentários e avaliações individuais de professores não são publicados.</p>
    </>
  )
}
