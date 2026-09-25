import { useEffect, useMemo, useState } from 'react'
import { fmtNota } from '../lib/cpa.js'
import { demandasParaSetor, nomeNucleoSetor, planosDosSetores, setoresDoNucleo } from '../lib/nucleo.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'
import ItemPlano from '../components/ItemPlano.jsx'
import { Fluxo } from './MeuSetor.jsx'
import './nucleo.css'

const ABAS = [
  ['geral', 'Visão geral'],
  ['demandas', 'Demandas recebidas'],
]

// Supervisor(a) de núcleo de setores (diretor_nucleo_setor): acompanha os setores do núcleo
// (ex.: Facilities = Limpeza, Manutenção e Segurança), seus planos de melhoria e as demandas recebidas.
export default function NucleoSetores({ perfil, base, param, recarregarBase }) {
  const [aba, setAba] = useState(ABAS.some(([k]) => k === param) ? param : 'geral')
  const [ids, setIds] = useState(null)
  const [erro, setErro] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let vivo = true
    setoresDoNucleo(perfil.nucleoSetor)
      .then((l) => vivo && setIds(l))
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [perfil.nucleoSetor])

  const planos = useMemo(() => (ids ? planosDosSetores(base.planos, base.usuarios, ids) : []), [base.planos, base.usuarios, ids])
  const demandas = useMemo(() => (ids ? ids.flatMap((sid) => demandasParaSetor(base.planos, base.usuarios, sid)) : []), [base.planos, base.usuarios, ids])

  if (erro) return <Erro erro={erro} />
  if (!ids) return <Carregando texto="Carregando os setores do núcleo…" />
  const setores = ids.map((id) => base.setores.find((s) => s.id === id)).filter(Boolean)
  const mudou = (t) => {
    setMsg(t || null)
    return recarregarBase()
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Supervisão de setores</div>
          <h1>Setores do {nomeNucleoSetor(perfil.nucleoSetor)}</h1>
        </div>
      </div>
      <div className="filtros">
        <div className="seg" role="tablist" aria-label="Áreas do núcleo">
          {ABAS.map(([k, t]) => (
            <button key={k} role="tab" aria-pressed={aba === k} aria-selected={aba === k} onClick={() => setAba(k)}>
              {t}{k === 'demandas' && demandas.length ? ` (${demandas.length})` : ''}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className="aviso ok" role="status">{msg}</div>}

      {aba === 'geral' && (
        <>
          {setores.length === 0 && <Vazio>Nenhum setor vinculado a este núcleo.</Vazio>}
          <div className="nu-auto">
            {setores.map((s) => {
              const pior = base.setorPerguntas.filter((p) => p.setor_id === s.id).sort((a, b) => Number(a.nota) - Number(b.nota))[0]
              return (
                <div key={s.id} className="card nu-card">
                  <div className="topo">
                    <h3>{s.nome}</h3>
                    <span className="num" style={{ fontSize: 26 }}>{fmtNota(Number(s.nota))}</span>
                  </div>
                  {pior && <div className="nu-pt"><b>Ponto mais fraco</b><span>{pior.pergunta}: {fmtNota(Number(pior.nota))}</span></div>}
                </div>
              )
            })}
          </div>
          <Fluxo planos={planos} titulo="Fluxo dos planos de melhoria dos setores" />
          <section className="card">
            <div className="card-h">
              <div className="t">
                <h2>Planos de melhoria dos setores</h2>
                <p className="muted small">Visão de acompanhamento: a aprovação é feita pela CPA e pela Pró-Reitoria.</p>
              </div>
            </div>
            {planos.length === 0 && <Vazio>Nenhum plano de melhoria registrado pelos responsáveis destes setores ainda.</Vazio>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {planos.map((p) => <ItemPlano key={p.id} p={p} perfil={perfil} base={base} onMudou={mudou} />)}
            </div>
          </section>
        </>
      )}

      {aba === 'demandas' && (
        <section className="card">
          <div className="card-h">
            <div className="t">
              <h2>Demandas encaminhadas por coordenadores para os setores deste núcleo</h2>
            </div>
          </div>
          {demandas.length === 0 && <Vazio>Nenhuma demanda encaminhada por coordenadores para estes setores até o momento.</Vazio>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {demandas.map((d) => (
              <ItemPlano key={d.id} p={d} perfil={perfil} base={base} onMudou={mudou} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
