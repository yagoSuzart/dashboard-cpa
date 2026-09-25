import { useCallback, useEffect, useMemo, useState } from 'react'
import { STATUS_PLANO } from '../lib/config.js'
import { rotuloCurso } from '../lib/escopo.js'
import { fmtInt } from '../lib/cpa.js'
import {
  ROLES_ALVO_COBRANCA,
  podeVerAgenda,
  podeGerenciarAgenda,
  podeVerPrazos,
  listarEntregas,
  criarEntrega,
  atualizarPrazoEntrega,
  reenviarCobranca,
  entregaAtrasada,
  fmtDataBR,
  montarPrazos,
  situacaoPrazo,
} from '../lib/agenda.js'
import { Carregando, Vazio, Paginacao } from '../components/ui.jsx'
import CobrancaAuxiliares from '../components/CobrancaAuxiliares.jsx'
import './agenda.css'

// Agenda de entregas (Pró-Reitoria, CPA, Comissão e admin; só o admin cria e edita)
// e Prazos (só admin), como no sistema anterior. param 'prazos' abre direto a aba de prazos.
export default function Agenda({ perfil, base, param }) {
  const abas = [
    ...(podeVerAgenda(perfil) ? [{ k: 'agenda', t: 'Agenda de entregas' }] : []),
    ...(podeVerPrazos(perfil) ? [{ k: 'prazos', t: 'Prazos' }] : []),
  ]
  const [aba, setAba] = useState(abas.some((a) => a.k === param) ? param : abas[0]?.k)

  if (!abas.length) return <Vazio>Esta área é da Pró-Reitoria, da Coordenação da CPA, da Comissão CPA e da gestão do sistema.</Vazio>

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Agenda e prazos</div>
          <h1>{aba === 'prazos' ? 'Prazos dos planos de melhoria.' : 'Cobranças de entrega do plano de ação.'}</h1>
        </div>
      </div>
      {abas.length > 1 && (
        <div className="seg" role="group" aria-label="Seções">
          {abas.map((a) => (
            <button key={a.k} aria-pressed={aba === a.k} onClick={() => setAba(a.k)}>{a.t}</button>
          ))}
        </div>
      )}
      {aba === 'agenda' && <AgendaEntregas perfil={perfil} base={base} />}
      {aba === 'prazos' && <Prazos perfil={perfil} base={base} />}
    </>
  )
}

function AgendaEntregas({ perfil, base }) {
  const souAdmin = podeGerenciarAgenda(perfil)
  const [lista, setLista] = useState(null)
  const [falhou, setFalhou] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [form, setForm] = useState({ usuarioId: '', prazo: '', mensagem: '' })
  const [salvando, setSalvando] = useState(false)
  const [novosPrazos, setNovosPrazos] = useState({})
  const [ocupado, setOcupado] = useState(null)

  const nomeSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s.nome])), [base.setores])
  const alvos = useMemo(() => base.usuarios.filter((u) => ROLES_ALVO_COBRANCA.includes(u.role)), [base.usuarios])
  const usuarioId = form.usuarioId || alvos[0]?.id || ''

  const carregar = useCallback(async () => {
    try {
      const l = await listarEntregas()
      setLista(l)
      setFalhou(false)
    } catch (e) {
      console.error('Erro ao carregar agenda de entregas:', e)
      setFalhou(true)
      setLista([])
    }
  }, [])

  useEffect(() => {
    let vivo = true
    listarEntregas()
      .then((l) => vivo && setLista(l))
      .catch((e) => {
        console.error('Erro ao carregar agenda de entregas:', e)
        if (!vivo) return
        setFalhou(true)
        setLista([])
      })
    return () => {
      vivo = false
    }
  }, [])

  function mostrar(r) {
    if (r?.aviso) setAviso({ tipo: r.tipo === 'ok' ? 'ok' : r.tipo === 'erro' ? 'erro' : '', t: r.aviso })
  }

  async function criar(ev) {
    ev.preventDefault()
    if (salvando) return
    setSalvando(true)
    setAviso(null)
    try {
      const r = await criarEntrega(perfil, { ...form, usuarioId })
      mostrar(r)
      if (r.ok) {
        setForm((f) => ({ ...f, prazo: '', mensagem: '' }))
        await carregar()
      }
    } finally {
      setSalvando(false)
    }
  }

  async function salvarPrazo(e) {
    const prazo = novosPrazos[e.id] ?? e.prazo
    if (!prazo) return
    setOcupado(e.id)
    const r = await atualizarPrazoEntrega(e.id, prazo)
    mostrar(r)
    if (r.ok) await carregar()
    setOcupado(null)
  }

  async function reenviar(e) {
    setOcupado(e.id)
    mostrar(await reenviarCobranca(e.id))
    setOcupado(null)
  }

  return (
    <>
      {aviso && <div className={'aviso ' + aviso.tipo} role="status">{aviso.t}</div>}
      {souAdmin && (
        <form className="card" onSubmit={criar}>
          <div className="card-h">
            <div className="t">
              <h2>Nova cobrança de prazo</h2>
              <p className="muted small">A pessoa recebe a mensagem por e-mail. Quando ela enviar o plano de ação, a cobrança é marcada como entregue e a Pró-Reitoria e a CPA são avisadas.</p>
            </div>
          </div>
          <div className="ag-form">
            <div className="campo">
              <label htmlFor="ag-usuario">Coordenador(a) ou setor</label>
              <select id="ag-usuario" value={usuarioId} onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}>
                {alvos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                    {u.role === 'setor' ? ` (Setor: ${nomeSetor[u.setor_id] || u.setor_id})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="ag-prazo">Prazo pra entrega</label>
              <input id="ag-prazo" type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </div>
            <div className="campo inteiro">
              <label htmlFor="ag-mensagem">Mensagem (vai por e-mail — e você pode copiar pra mandar pelo WhatsApp também)</label>
              <textarea
                id="ag-mensagem"
                className="ag-textarea"
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                placeholder="Precisamos que você entregue o plano de ação do seu curso/setor até a data acima. Qualquer dúvida, me chama!"
              />
            </div>
          </div>
          <div className="chips">
            <button className="btn escuro" type="submit" disabled={salvando}>{salvando ? 'Criando…' : 'Criar cobrança e enviar e-mail'}</button>
          </div>
        </form>
      )}
      <section className="card">
        <div className="card-h">
          <div className="t"><h2>Cobranças agendadas</h2></div>
          <div className="spacer" />
          {lista && lista.length > 0 && <span className="selo cinza">{fmtInt(lista.length)}</span>}
        </div>
        {!lista ? (
          <Carregando texto="Carregando a agenda…" />
        ) : falhou ? (
          <Vazio>Não foi possível carregar a agenda agora. Tente de novo em alguns segundos.</Vazio>
        ) : lista.length === 0 ? (
          <Vazio>Nenhuma cobrança de prazo criada ainda.</Vazio>
        ) : (
          <div className="ag-lista">
            {lista.map((e) => (
              <div key={e.id} className="plano-item">
                <div className="ag-cab">
                  <b>{e.usuario ? e.usuario.nome : 'Pessoa não encontrada'}</b>
                  {e.status === 'cumprido' ? (
                    <span className="selo verde">Entregue</span>
                  ) : entregaAtrasada(e) ? (
                    <span className="selo laranja">Atrasado</span>
                  ) : (
                    <span className="selo cinza">Pendente</span>
                  )}
                </div>
                <span className="small muted">
                  Prazo: {fmtDataBR(e.prazo)}
                  {e.cumprido_em && ` · Entregue em: ${fmtDataBR(e.cumprido_em)}`}
                </span>
                {e.mensagem && <p className="ag-desc">{e.mensagem}</p>}
                {souAdmin && e.status === 'pendente' && (
                  <div className="ag-acoes">
                    <label className="sr-only" htmlFor={'ag-prazo-' + e.id}>Novo prazo</label>
                    <input
                      id={'ag-prazo-' + e.id}
                      type="date"
                      className="input"
                      value={novosPrazos[e.id] ?? e.prazo}
                      onChange={(ev) => setNovosPrazos({ ...novosPrazos, [e.id]: ev.target.value })}
                    />
                    <button className="btn sm" disabled={ocupado === e.id} onClick={() => salvarPrazo(e)}>Salvar novo prazo</button>
                    <button className="btn sm" disabled={ocupado === e.id} onClick={() => reenviar(e)}>Reenviar e-mail</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

const POR_PAGINA = 30

function Prazos({ perfil, base }) {
  const { resumo, itens } = useMemo(() => montarPrazos(base), [base])
  const [pagina, setPagina] = useState(0)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s.nome])), [base.setores])
  const alvo = (p) => (p.tipo === 'setor' ? (porSetor[p.setor_id] || p.setor_id) + ' (Setor)' : rotuloCurso(porCurso[p.curso_id]) || p.curso_id)
  const pag = itens.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  return (
    <>
      <div className="ag-resumo">
        <Kpi v={resumo.atrasado} l="Atrasados" />
        <Kpi v={resumo.vencendo} l="Vencendo em até 7 dias" />
        <Kpi v={resumo.emDia} l="Em dia" />
        <Kpi v={resumo.aprovado} l="Já aprovados" />
      </div>
      <CobrancaAuxiliares perfil={perfil} base={base} />
      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Todos os planos de melhoria — cursos e setores</h2>
            <p className="muted small">Do mais urgente para o menos urgente: atrasados, vencendo, em dia, aprovados e concluídos.</p>
          </div>
        </div>
        {itens.length === 0 ? (
          <Vazio>Nenhum plano de melhoria registrado ainda, nem de curso nem de setor.</Vazio>
        ) : (
          <>
            <div className="ag-lista">
              {pag.map(({ p, coordNome, setorNome }) => {
                const sit = situacaoPrazo(p)
                return (
                  <div key={p.id} className="plano-item">
                    <b style={{ overflowWrap: 'anywhere' }}>{p.titulo || alvo(p) + (p.categoria ? ' — ' + p.categoria : '')}</b>
                    <div className="chips" style={{ gap: 6 }}>
                      <span className="selo escuro">{STATUS_PLANO[p.status] || p.status}</span>
                      {sit && <span className={'selo ' + sit.c}>{sit.t}</span>}
                      {p.prioridade && <span className="selo cinza">Prioridade {p.prioridade}</span>}
                      {p.categoria && <span className="selo cinza">{p.categoria}</span>}
                      {p.externa && <span className="selo laranja">Dependência externa{p.area ? `: ${porSetor[p.area] || p.area}` : ''}</span>}
                    </div>
                    <span className="small muted">
                      {alvo(p)}
                      {coordNome && ` · Coordenador(a): ${coordNome}`}
                      {setorNome && ` · Setor: ${setorNome}`}
                      {p.prazo && ` · Prazo de entrega: ${fmtDataBR(p.prazo)}`}
                    </span>
                    {p.descricao && <p className="ag-desc">{p.descricao}</p>}
                    {p.indicador && <p className="ag-desc muted"><b>Indicador de sucesso:</b> {p.indicador}</p>}
                  </div>
                )
              })}
            </div>
            <Paginacao pagina={pagina} total={itens.length} porPagina={POR_PAGINA} onPagina={setPagina} />
          </>
        )}
      </section>
    </>
  )
}

function Kpi({ v, l }) {
  return (
    <div className="card kpi">
      <span className="v">{fmtInt(v)}</span>
      <span className="l">{l}</span>
    </div>
  )
}
