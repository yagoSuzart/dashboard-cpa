import { META } from '../lib/config.js'
import { fmtNota, fmtInt } from '../lib/cpa.js'

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="centro" role="status">
      <div>
        <div className="spin" />
        {texto}
      </div>
    </div>
  )
}

export function Vazio({ children }) {
  return <div className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>{children}</div>
}

export function Erro({ erro }) {
  if (!erro) return null
  return <div className="aviso erro" role="alert">{String(erro.message || erro)}</div>
}

// Barra de 3 a 5 (as notas reais ficam quase todas nessa faixa), com a meta 4,0 tracejada
export function BarraNota({ v, fina, min = 3, max = 5 }) {
  const pct = v == null ? 0 : Math.max(2, Math.min(100, ((v - min) / (max - min)) * 100))
  const cor = v == null ? 'transparent' : v < META ? 'var(--ember)' : 'var(--blue)'
  const metaPct = ((META - min) / (max - min)) * 100
  return (
    <div className={'trilho-barra' + (fina ? ' fina' : '')} aria-hidden="true">
      <div className="fill" style={{ width: pct + '%', background: cor }} />
      {!fina && <div className="meta" style={{ left: metaPct + '%' }} />}
    </div>
  )
}

export function SeloNota({ v }) {
  if (v == null) return <span className="selo cinza">sem nota</span>
  return v < META ? <span className="selo laranja">abaixo da meta</span> : <span className="selo azul">na meta</span>
}

export function Delta({ v, base: r }) {
  if (v == null || r == null) return null
  const d = v - r
  const txt = (d >= 0 ? '+' : '−') + fmtNota(Math.abs(d))
  return <span className={'selo ' + (d >= 0 ? 'azul' : 'laranja')}>{txt} vs. instituição</span>
}

// Cores das notas: da mais alta (azul escuro) à mais baixa (laranja escuro)
const CORES_1A5 = { 5: '#0B3A63', 4: '#5B9BD5', 3: '#E7B75A', 2: '#C2571F', 1: '#6E2A0C' }
function cor0a10(v) {
  if (v >= 9) return '#0B3A63'
  if (v >= 7) return '#5B9BD5'
  if (v >= 5) return '#E7B75A'
  if (v >= 3) return '#C2571F'
  return '#6E2A0C'
}

export function Distribuicao({ est }) {
  const itens = [...est.contagem].sort((a, b) => b.valor - a.valor)
  const total = est.n + est.naoUtilizo
  return (
    <>
      <div className="dist" aria-hidden="true">
        {itens.map((c) => (
          <span
            key={c.valor}
            style={{ width: total ? (c.qtd / total) * 100 + '%' : 0, background: est.escala === '0a10' ? cor0a10(c.valor) : CORES_1A5[c.valor] }}
          />
        ))}
        {est.naoUtilizo > 0 && <span style={{ width: (est.naoUtilizo / total) * 100 + '%', background: '#D4CFC4' }} />}
      </div>
      <div className="contagens">
        {itens.filter((c) => c.qtd > 0).map((c) => (
          <span key={c.valor} className={c.valor === 1 || (est.escala === '0a10' && c.valor <= 3) ? 'baixo' : c.valor === (est.escala === '0a10' ? 10 : 5) ? 'alto' : ''}>
            {fmtInt(c.qtd)} {c.qtd === 1 ? 'aluno deu' : 'alunos deram'} {c.valor}
          </span>
        ))}
        {est.naoUtilizo > 0 && (
          <span>
            {fmtInt(est.naoUtilizo)} {est.naoUtilizo === 1 ? 'aluno marcou' : 'alunos marcaram'} 6 (fora da média)
          </span>
        )}
      </div>
    </>
  )
}

export function Legenda({ escala }) {
  if (escala === '0a10')
    return (
      <div className="legenda">
        <span><i style={{ background: '#0B3A63' }} />9 e 10</span>
        <span><i style={{ background: '#5B9BD5' }} />7 e 8</span>
        <span><i style={{ background: '#E7B75A' }} />5 e 6</span>
        <span><i style={{ background: '#C2571F' }} />3 e 4</span>
        <span><i style={{ background: '#6E2A0C' }} />0 a 2</span>
      </div>
    )
  return (
    <div className="legenda">
      {[5, 4, 3, 2, 1].map((v) => (
        <span key={v}><i style={{ background: CORES_1A5[v] }} />{v}</span>
      ))}
      <span><i style={{ background: '#D4CFC4' }} />6 (fica fora da média)</span>
    </div>
  )
}

export function Anel({ valor, max = 10, rotulo }) {
  const r = 66
  const c = 2 * Math.PI * r
  const f = valor == null ? 0 : Math.max(0, Math.min(1, valor / max))
  return (
    <svg width="150" height="150" viewBox="0 0 160 160" role="img" aria-label={`${rotulo || ''} ${fmtNota(valor)} de ${max}`}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="12" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="#9FE0B8" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 80 80)" />
      <text x="80" y="88" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="40" fill="#fff">{fmtNota(valor)}</text>
      <text x="80" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#C9D3E1">de {max}</text>
    </svg>
  )
}

export function Paginacao({ pagina, total, porPagina, onPagina }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (total <= porPagina) return null
  return (
    <div className="paginacao">
      <span>
        {fmtInt(pagina * porPagina + 1)}–{fmtInt(Math.min(total, (pagina + 1) * porPagina))} de {fmtInt(total)}
      </span>
      <button className="btn sm" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>Anterior</button>
      <button className="btn sm" disabled={pagina >= paginas - 1} onClick={() => onPagina(pagina + 1)}>Próxima</button>
    </div>
  )
}
