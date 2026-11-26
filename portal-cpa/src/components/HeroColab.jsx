// Topo da página aberta, aba "Docentes e ADM": quantos já avaliaram, ao vivo, no mesmo formato do cartão dos alunos.
import { fmtNum } from '../lib/aoVivo.js'
import { deHoje, fmtPctColab, pctDe, quando } from '../lib/colabPublico.js'

const hora = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function HeroColab({ d }) {
  if (d === undefined) return <p className="pp-mut">Carregando…</p>
  if (!d) return <p className="pp-mut">Não foi possível carregar os números agora. Tente de novo em instantes.</p>
  const doc = d.respostas?.docente || 0
  const tec = d.respostas?.tecnico || 0
  const total = doc + tec
  const el = d.elegiveis || {}
  const elTotal = (el.docente || 0) + (el.tecnico || 0)
  const p = pctDe(total, elTotal)
  const hoje = deHoje(d)
  const antes = !d.aberta && d.abre_em && new Date(d.abre_em) > new Date()
  return (
    <>
      <h3><span className="cv-pulso" aria-hidden="true" />Ao vivo · CPA {d.ciclo} · Docentes e ADM</h3>
      <div className="pp-big">{fmtNum(total)}<small>{total === 1 ? 'avaliação enviada' : 'avaliações enviadas'}</small></div>
      <span className="pp-big-sub">{p != null ? `${fmtPctColab(p)} dos ${fmtNum(elTotal)} docentes e colaboradores` : 'docentes e colaboradores do administrativo'}</span>
      {p != null && <div className="pp-prog" aria-hidden="true"><i style={{ width: p + '%', background: 'var(--pp-lima)' }} /></div>}
      {hoje > 0 && <div className="pp-andam"><b>+{fmtNum(hoje)}</b> {hoje === 1 ? 'avaliação chegou' : 'avaliações chegaram'} hoje</div>}
      <div className="pp-mini hc-mini">
        <div><small>DOCENTES</small><b>{fmtNum(doc)}</b><span className="and">{el.docente ? `${fmtPctColab(pctDe(doc, el.docente))} de ${fmtNum(el.docente)}` : 'professores'}</span></div>
        <div><small>ADMINISTRATIVO</small><b>{fmtNum(tec)}</b><span className="and">{el.tecnico ? `${fmtPctColab(pctDe(tec, el.tecnico))} de ${fmtNum(el.tecnico)}` : 'colaboradores'}</span></div>
      </div>
      <p className="pp-atual">
        {antes ? `Abre ${quando(d.abre_em)}` : d.aberta ? 'Avaliação aberta' : 'Avaliação encerrada'}
        {d.ultima ? ` · última avaliação em ${hora(d.ultima)}` : ''} · atualiza sozinho a cada minuto
      </p>
    </>
  )
}
