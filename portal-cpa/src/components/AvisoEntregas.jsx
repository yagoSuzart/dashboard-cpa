import { useEffect, useState } from 'react'
import { minhasEntregasPendentes, marcarEntregaCumprida, entregaAtrasada, fmtDataBR } from '../lib/agenda.js'
import '../views/agenda.css'

// Cobranças de prazo pendentes da própria pessoa (para a Visão geral). Some quando não há nenhuma.
export default function AvisoEntregas({ perfil }) {
  const [lista, setLista] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [enviando, setEnviando] = useState(null)

  useEffect(() => {
    if (!perfil?.id) return
    let vivo = true
    minhasEntregasPendentes(perfil)
      .then((l) => vivo && setLista(l))
      .catch((e) => {
        console.error('Erro ao carregar entregas pendentes:', e)
        if (vivo) setLista([])
      })
    return () => {
      vivo = false
    }
  }, [perfil])

  async function cumprir(e) {
    if (enviando) return
    setEnviando(e.id)
    setAviso(null)
    try {
      await marcarEntregaCumprida(e.id)
      setLista((l) => l.filter((x) => x.id !== e.id))
      setAviso({ tipo: 'ok', t: 'Entrega marcada como cumprida. A Pró-Reitoria e a CPA foram avisadas por e-mail.' })
    } catch (err) {
      console.error('Erro ao marcar entrega:', err)
      setAviso({ tipo: 'erro', t: 'Não foi possível marcar a entrega agora. Tente de novo em alguns segundos.' })
    } finally {
      setEnviando(null)
    }
  }

  if (!lista || (!lista.length && !aviso)) return null

  return (
    <section className="card ag-aviso" aria-label="Entregas pendentes">
      {lista.length > 0 && (
        <div className="card-h">
          <div className="t">
            <div className="eyebrow">Agenda de entregas</div>
            <h2>{lista.length === 1 ? 'Você tem um plano de ação para entregar' : `Você tem ${lista.length} cobranças de plano de ação`}</h2>
            <p className="muted small">Ao enviar seu plano de ação, a cobrança é marcada como cumprida automaticamente. Se já entregou, marque aqui.</p>
          </div>
        </div>
      )}
      {aviso && <div className={'aviso ' + aviso.tipo}>{aviso.t}</div>}
      <div className="ag-lista">
        {lista.map((e) => (
          <div key={e.id} className="plano-item">
            <div className="ag-cab">
              <b>Prazo: {fmtDataBR(e.prazo)}</b>
              {entregaAtrasada(e) ? <span className="selo laranja">Atrasado</span> : <span className="selo cinza">Pendente</span>}
            </div>
            {e.mensagem && <p className="ag-desc">{e.mensagem}</p>}
            <div className="ag-acoes">
              <a className="btn sm escuro" href="#/planos">Ir para os planos</a>
              <button className="btn sm" disabled={enviando === e.id} onClick={() => cumprir(e)}>
                {enviando === e.id ? 'Marcando…' : 'Já entreguei — marcar como cumprido'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
