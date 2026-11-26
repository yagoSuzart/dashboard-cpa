// Página aberta: CPA de Docentes e Administrativo, ao vivo. Os números vêm direto das respostas do Portal
// (sem planilha); os dados chegam por useColabAoVivo (atualiza a cada minuto). Só agregados; médias de um público só com 5+ respostas.
import { deHoje, fmtPctColab, pctDe, quando } from '../lib/colabPublico.js'
import { fmtNum } from '../lib/aoVivo.js'

const nota = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const hora = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const corNota = (v) => (v >= 4.3 ? '#8be36a' : v >= 4 ? '#b7f19c' : v >= 3.5 ? '#f0a33a' : '#ff8a5c')

// d: o resultado de useColabAoVivo() (carregado uma vez na página)
export default function ColabAoVivo({ d }) {
  if (!d) return null
  const doc = d.respostas?.docente || 0
  const tec = d.respostas?.tecnico || 0
  const total = doc + tec
  const hoje = deHoje(d)
  const el = d.elegiveis || {}
  const elTotal = (el.docente || 0) + (el.tecnico || 0)
  const maxEixo = 5

  return (
    <section className="pp-s cv" id="colaboradores">
      <div className="pp-w">
        <div className="pp-eb"><span className="cv-pulso" aria-hidden="true" />Ao vivo · CPA {d.ciclo} · Docentes e Administrativo</div>
        <h2>Quem faz a UniFECAF <span>também avalia.</span></h2>
        <p className="pp-sub">Números direto do Portal, sem planilha: cada avaliação enviada aparece aqui em até um minuto.</p>

        <div className="cv-kpis">
          <div className="pp-card cv-k grande"><b>{fmtNum(total)}</b><span>avaliações enviadas</span>{elTotal > 0 && <span>{fmtPctColab(pctDe(total, elTotal))} de {fmtNum(elTotal)} colaboradores</span>}{hoje > 0 && <em>+{fmtNum(hoje)} hoje</em>}</div>
          <div className="pp-card cv-k"><small>Docentes</small><b>{fmtNum(doc)}</b><span>{el.docente ? `${fmtPctColab(pctDe(doc, el.docente))} de ${fmtNum(el.docente)} professores` : 'professores'}</span></div>
          <div className="pp-card cv-k"><small>Administrativo</small><b>{fmtNum(tec)}</b><span>{el.tecnico ? `${fmtPctColab(pctDe(tec, el.tecnico))} de ${fmtNum(el.tecnico)} colaboradores` : 'colaboradores'}</span></div>
          <div className="pp-card cv-k"><small>Recomendaria como lugar para trabalhar</small>
            {d.nps ? <><b>{d.nps.todos > 0 ? '+' : ''}{d.nps.todos}</b><span>NPS · média {String(d.nps.media).replace('.', ',')} de 10</span></> : <><b>—</b><span>aparece com 5 avaliações</span></>}
          </div>
        </div>

        {d.eixos?.length > 0 ? (
          <div className="pp-card cv-eixos">
            <h4>Satisfação por eixo <small>média de 1 a 5 · docentes e administrativo lado a lado</small></h4>
            {d.eixos.map((e) => (
              <div className="cv-eixo" key={e.eixo}>
                <p><span>Eixo {e.eixo}</span>{e.titulo}</p>
                <div className="cv-barras">
                  {[['todos', 'Geral', 'var(--pp-ink)'], ['docente', 'Docentes', '#2DD483'], ['tecnico', 'Administrativo', '#4F8FF0']].map(([k, t, cor]) => (
                    <div className="cv-b" key={k}>
                      <span>{t}</span>
                      <div className="cv-trilho"><i style={{ width: e[k] != null ? (e[k] / maxEixo) * 100 + '%' : 0, background: cor }} /></div>
                      <b style={{ color: e[k] != null ? corNota(e[k]) : undefined }}>{e[k] != null ? nota(e[k]) : 'com 5+'}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="pp-mut cv-espera">As notas por eixo aparecem assim que chegarem 5 avaliações: com menos que isso, alguém poderia ser reconhecido.</p>
        )}

        <p className="pp-atual">
          {d.aberta ? 'Avaliação aberta' : d.abre_em && new Date(d.abre_em) > new Date() ? `A avaliação abre ${quando(d.abre_em)}` : 'Avaliação encerrada'}{d.fecha_em ? ` até ${new Date(d.fecha_em + 'T12:00').toLocaleDateString('pt-BR')}` : ''}
          {d.ultima ? ` · última avaliação recebida em ${hora(d.ultima)}` : ''} · atualiza sozinho a cada minuto
        </p>
      </div>
    </section>
  )
}
