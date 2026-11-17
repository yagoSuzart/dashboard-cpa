// Evolução da CPA, dia a dia: alunos que concluíram tudo (acumulado) como percentual dos elegíveis, para o total da
// UniFECAF e cada modelo de oferta. O topo do gráfico (100%) são todos os elegíveis: mostra o quanto ainda falta.
// Linhas finas, rótulo no fim de cada linha, legenda, dica ao passar o mouse e a mesma informação em tabela.
import { useEffect, useMemo, useRef, useState } from 'react'

const TOPO = 24, BASE = 44
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR')
const diaCurto = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

const pc = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'

// base: elegíveis de cada linha ({ total, PRESENCIAL, SEMIPRESENCIAL, EAD })
export default function GraficoEvolucao({ pontos, series, base }) {
  const [hover, setHover] = useState(null)
  const [tabela, setTabela] = useState(false)
  const caixa = useRef(null)
  // No celular o desenho é mais estreito e alto, para o texto não ficar minúsculo
  const [estreito, setEstreito] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 600px)')
    const f = () => setEstreito(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  const W = estreito ? 420 : 1000, H = estreito ? 340 : 380, ESQ = estreito ? 46 : 64, DIR = estreito ? 74 : 190
  const linhas = [{ k: 'total', t: 'UniFECAF', cor: 'var(--pp-ink, #eef3fb)', grossa: true }, ...series]

  const topo = 100, passo = 25
  const perc = useMemo(() => (p, k) => (base?.[k] ? (p[k] / base[k]) * 100 : 0), [base])
  const x = (i) => ESQ + (pontos.length === 1 ? (W - ESQ - DIR) / 2 : (i * (W - ESQ - DIR)) / (pontos.length - 1))
  const y = (v) => TOPO + (H - TOPO - BASE) * (1 - v / topo)
  const ticks = []
  for (let v = 0; v <= topo; v += passo) ticks.push(v)
  const salto = Math.max(1, Math.ceil(pontos.length / (estreito ? 4 : 8)))

  // Rótulos no fim das linhas, afastados para não encostar um no outro
  const fim = pontos[pontos.length - 1]
  const rotulos = linhas.map((l) => ({ ...l, v: fim[l.k], p: perc(fim, l.k), yy: y(perc(fim, l.k)) })).sort((a, b) => a.yy - b.yy)
  for (let i = 1; i < rotulos.length; i++) if (rotulos[i].yy - rotulos[i - 1].yy < 22) rotulos[i].yy = rotulos[i - 1].yy + 22
  // Rótulos colados no chão sobem para caberem acima do eixo
  const chao = H - BASE - 4
  if (rotulos.length && rotulos[rotulos.length - 1].yy > chao) {
    const desloca = rotulos[rotulos.length - 1].yy - chao
    rotulos.forEach((r) => { r.yy -= desloca })
  }

  function mover(e) {
    const r = caixa.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let melhor = 0
    pontos.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i })
    setHover(melhor)
  }

  const h = hover != null ? pontos[hover] : null
  return (
    <div className="ge">
      <div className="ge-topo">
        <div className="ge-leg" aria-label="Legenda">
          {linhas.map((l) => <span key={l.k}><i style={{ background: l.cor, height: l.grossa ? 4 : 3 }} />{l.t}</span>)}
        </div>
        <button type="button" className="ge-alterna" onClick={() => setTabela((t) => !t)}>{tabela ? 'Ver gráfico' : 'Ver em tabela'}</button>
      </div>
      {tabela ? (
        <div className="ge-tab">
          <table>
            <thead><tr><th>Dia</th>{linhas.map((l) => <th key={l.k}>{l.t} <small>(de {fmt(base?.[l.k])})</small></th>)}</tr></thead>
            <tbody>{[...pontos].reverse().map((p) => <tr key={p.dia}><td>{diaCurto(p.dia)}</td>{linhas.map((l) => <td key={l.k}>{fmt(p[l.k])} · {pc(perc(p, l.k))}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="ge-caixa" ref={caixa} onMouseMove={mover} onMouseLeave={() => setHover(null)} onTouchStart={(e) => mover(e.touches[0])} onTouchMove={(e) => mover(e.touches[0])}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução: ${fmt(fim.total)} alunos concluíram tudo até ${diaCurto(fim.dia)}, ${pc(perc(fim, 'total'))} dos elegíveis`}>
            <text x={W - DIR + 22} y={y(100) + 5} className="ge-meta">{estreito ? '100%' : `${fmt(base?.total)} elegíveis`}</text>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={ESQ} x2={W - DIR + 10} y1={y(v)} y2={y(v)} className="ge-grade" />
                <text x={ESQ - 12} y={y(v) + 5} textAnchor="end" className="ge-eixo">{v}%</text>
              </g>
            ))}
            {pontos.map((p, i) => ((i % salto === 0 && pontos.length - 1 - i >= salto / 2) || i === pontos.length - 1) && (
              <text key={p.dia} x={x(i)} y={H - 14} textAnchor="middle" className="ge-eixo">{diaCurto(p.dia)}</text>
            ))}
            {h && <line x1={x(hover)} x2={x(hover)} y1={TOPO} y2={H - BASE} className="ge-mira" />}
            {[...linhas].reverse().map((l) => (
              <polyline key={l.k} fill="none" stroke={l.cor} strokeWidth={l.grossa ? 3.5 : 2.2} strokeLinejoin="round" strokeLinecap="round"
                points={pontos.map((p, i) => `${x(i)},${y(perc(p, l.k))}`).join(' ')} />
            ))}
            {linhas.map((l) => <circle key={l.k} cx={x(pontos.length - 1)} cy={y(perc(fim, l.k))} r={l.grossa ? 6 : 5} fill={l.cor} stroke="#111c38" strokeWidth="2" />)}
            {h && linhas.map((l) => <circle key={'h' + l.k} cx={x(hover)} cy={y(perc(h, l.k))} r={5} fill={l.cor} stroke="#111c38" strokeWidth="2" />)}
            {rotulos.map((l) => (
              <text key={'r' + l.k} x={W - DIR + 22} y={l.yy + 5} className={'ge-rot' + (l.grossa ? ' forte' : '')}>{pc(l.p)}<tspan className="ge-rot-nome"> · {l.t}</tspan></text>
            ))}
          </svg>
          {h && (
            <div className="ge-dica" style={{ left: `${(x(hover) / W) * 100}%` }}>
              <b>{diaCurto(h.dia)}</b>
              {linhas.map((l) => <span key={l.k}><i style={{ background: l.cor }} />{l.t}<b>{pc(perc(h, l.k))}</b><em>{fmt(h[l.k])} de {fmt(base?.[l.k])}</em></span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
