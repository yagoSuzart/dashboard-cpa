import { useEffect, useMemo, useState } from 'react'
import { carregarConsolidado, listarAutorizados, adicionarAutorizado, atualizarAutorizado, removerAutorizado } from '../lib/api.js'
import { decidiveis, escolhidasDe, criadasPor } from '../lib/escolhas.js'
import { EIXOS, DIMENSOES, cobertura } from '../lib/model.js'
import { EixoTag, DimTag, DecisionChip, StatusPill } from '../components/ui.jsx'

// Gabarito: todos os eixos e dimensões precisam de pelo menos 1 pergunta (em uso + aprovadas)
function Gabarito({ model, pessoas, ir }) {
  const [base, setBase] = useState('consenso')
  const esc = escolhidasDe(model, pessoas, base).filter((q) => q.dim)
  const cob = cobertura(model, esc)
  const faltam = cob.filter((c) => c.total === 0)
  const eixosOk = EIXOS.filter((e) => e.dims.every((d) => cob.find((c) => c.dim === d).total > 0)).length
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-h">
        <div>
          <h2>Gabarito SINAES</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            Perguntas em uso + perguntas aprovadas. Cada dimensão precisa ter pelo menos uma pergunta.
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="seg">
          <button className={base === 'consenso' ? 'on' : ''} onClick={() => setBase('consenso')}>
            Consenso
          </button>
          <button className={base === 'uniao' ? 'on' : ''} onClick={() => setBase('uniao')}>
            Pelo menos uma marcou
          </button>
        </div>
      </div>
      <div className="card-b">
        <div className={`gab-banner ${faltam.length ? 'falta' : 'ok'}`}>
          <span className="gab-ico" aria-hidden="true">
            {faltam.length ? '!' : '✓'}
          </span>
          <div style={{ flex: 1 }}>
            <b>
              {faltam.length
                ? `Faltam ${faltam.length} dimensão(ões) — é preciso incrementar`
                : 'Gabarito completo: os 5 eixos e as 10 dimensões estão atendidos'}
            </b>
            <div style={{ fontSize: 13 }}>
              {eixosOk}/5 eixos completos · {10 - faltam.length}/10 dimensões com pergunta · {esc.length} pergunta(s)
              nova(s) aprovada(s)
              {faltam.length > 0 && ' · Sem pergunta: ' + faltam.map((c) => `D${c.dim} ${DIMENSOES[c.dim]}`).join(', ')}
            </div>
          </div>
          {faltam.length > 0 && (
            <button className="btn primary sm" onClick={() => ir('curadoria')}>
              Incrementar perguntas →
            </button>
          )}
        </div>
        <div className="gab-grid">
          {EIXOS.map((e) => {
            const completo = e.dims.every((d) => cob.find((c) => c.dim === d).total > 0)
            return (
              <div key={e.n} className={`gab-eixo ${completo ? 'ok' : 'falta'}`} style={{ '--c': e.cor }}>
                <div className="gab-eixo-h">
                  <span className="gab-check" aria-label={completo ? 'Completo' : 'Incompleto'}>
                    {completo ? '✓' : '!'}
                  </span>
                  <div>
                    <div className="n">Eixo {e.n}</div>
                    <b>{e.nome}</b>
                  </div>
                </div>
                {e.dims.map((d) => {
                  const c = cob.find((x) => x.dim === d)
                  return (
                    <div key={d} className="gab-dim">
                      <span>
                        D{d} · {DIMENSOES[d]}
                      </span>
                      <span className="muted num" title={`${c.emUso} em uso + ${c.sel} aprovada(s)`}>
                        {c.emUso}+{c.sel}
                      </span>
                      <StatusPill status={c.status} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Números: em uso + aprovadas. “Consenso” conta só o que todas marcaram “Entra”; perguntas criadas por uma
          pessoa entram em “Pelo menos uma marcou”.
        </div>
      </div>
    </div>
  )
}

export default function Consolidado({ model, sessao, ir }) {
  const [pessoas, setPessoas] = useState(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    carregarConsolidado(sessao)
      .then((d) => setPessoas(d.pessoas))
      .catch((e) => setErro(e.status === 403 ? 'Esta área é só para administradores.' : 'Não foi possível carregar.'))
  }, [sessao])

  const linhas = useMemo(() => {
    if (!pessoas) return []
    return decidiveis(model)
      .filter((q) => q.fonte === 'proposta' || pessoas.some((p) => p.decisoes?.[q.id]))
      .map((q) => {
        const st = pessoas.map((p) => p.decisoes?.[q.id]?.status || null)
        const dec = st.filter(Boolean)
        let acordo = 'aguardando'
        if (dec.length === pessoas.length && dec.every((s) => s === dec[0])) acordo = dec[0] === 'sim' ? 'entra' : dec[0] === 'nao' ? 'fora' : 'duvida'
        else if (new Set(dec).size > 1) acordo = 'divergencia'
        return {
          q,
          st,
          notas: pessoas.map((p) => p.decisoes?.[q.id]?.nota || ''),
          versoes: pessoas.map((p) => p.decisoes?.[q.id]?.texto || ''),
          acordo,
        }
      })
  }, [model, pessoas])

  if (erro) return <div className="card empty">{erro}</div>
  if (!pessoas) return <div className="card empty">Carregando…</div>

  const ACORDO = {
    entra: ['Consenso: entra', 'st-ok', '✓'],
    fora: ['Consenso: não entra', '', '✕'],
    duvida: ['Todas em dúvida', 'st-warn', '?'],
    divergencia: ['Divergência', 'st-crit', '≠'],
    aguardando: ['Aguardando', '', '…'],
  }
  const vis = linhas.filter((l) => filtro === 'todas' || l.acordo === filtro)
  const total = model.propostas.length

  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Administração</div>
          <h1>Visão consolidada</h1>
          <p>
            As escolhas de cada avaliadora, lado a lado. Cada pessoa só vê e edita as próprias escolhas; esta tela é
            só para quem administra.
          </p>
        </div>
      </div>

      {sessao.modo === 'supabase' && <Acessos sessao={sessao} />}

      {pessoas.length === 0 ? (
        <div className="card empty">Ninguém salvou escolhas ainda.</div>
      ) : (
        <>
          <div className="grid g4" style={{ marginBottom: 20 }}>
            {pessoas.map((p) => {
              const n = model.propostas.filter((q) => p.decisoes?.[q.id]?.status).length
              const s = Object.values(p.decisoes || {}).filter((d) => d.status === 'sim').length
              return (
                <div key={p.email} className="card kpi">
                  <div className="lbl">{p.nome || p.email}</div>
                  <div className="val num">
                    {n}
                    <small>/{total}</small>
                  </div>
                  <div className="sub">
                    avaliadas · {s} “Entra” · {(p.sugestoes || []).length} sugestão(ões)
                    <br />
                    {p.atualizadoEm ? 'atualizado em ' + new Date(p.atualizadoEm).toLocaleString('pt-BR') : ''}
                  </div>
                </div>
              )
            })}
          </div>

          <Gabarito model={model} pessoas={pessoas} ir={ir} />

          <Criadas pessoas={pessoas} />

          <div className="filters">
            <div className="seg">
              {[['todas', 'Todas'], ['entra', 'Consenso: entra'], ['divergencia', 'Divergência'], ['aguardando', 'Aguardando'], ['fora', 'Consenso: fora']].map(
                ([k, r]) => (
                  <button key={k} className={filtro === k ? 'on' : ''} onClick={() => setFiltro(k)}>
                    {r} · {k === 'todas' ? linhas.length : linhas.filter((l) => l.acordo === k).length}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="card tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Pergunta</th>
                  <th>Eixo / Dimensão</th>
                  {pessoas.map((p) => (
                    <th key={p.email}>{p.nome || p.email}</th>
                  ))}
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {vis.map(({ q, st, notas, versoes, acordo }) => (
                  <tr key={q.id}>
                    <td className="q">
                      {q.text}
                      {q.fonte === 'setor' && (
                        <div>
                          <span className="tag src" style={{ marginTop: 6 }}>
                            {q.aba}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <EixoTag n={q.eixo} />
                        <DimTag n={q.dim} texto={q.dimTexto} />
                      </div>
                    </td>
                    {st.map((s, i) => (
                      <td key={i}>
                        <DecisionChip status={s} />
                        {versoes[i] && (
                          <div className="versao-mini">
                            <span className="tag edit">✎ nova redação</span> {versoes[i]}
                          </div>
                        )}
                        {notas[i] && (
                          <div className="muted" style={{ fontSize: 12, marginTop: 6, maxWidth: 220 }}>
                            “{notas[i]}”
                          </div>
                        )}
                      </td>
                    ))}
                    <td>
                      <span className={`st ${ACORDO[acordo][1]}`} style={!ACORDO[acordo][1] ? { background: '#eef0f4', color: '#5b6475' } : undefined}>
                        <span className="i" style={!ACORDO[acordo][1] ? { background: '#8b93a3' } : undefined}>
                          {ACORDO[acordo][2]}
                        </span>
                        {ACORDO[acordo][0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

function Criadas({ pessoas }) {
  const lista = criadasPor(pessoas)
  if (!lista.length) return null
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-h">
        <h2>Perguntas criadas pelas avaliadoras</h2>
        <span className="muted">· {lista.length}</span>
      </div>
      <div className="card-b tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '46%' }}>Pergunta</th>
              <th>Eixo / Dimensão</th>
              <th>Tipo</th>
              <th>Criada por</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((g) => (
              <tr key={g.quem + g.id}>
                <td className="q">
                  {g.text}
                  {g.nota && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{g.nota}</div>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <EixoTag n={g.eixo} />
                    <DimTag n={g.dim} />
                  </div>
                </td>
                <td style={{ fontSize: 12.5 }}>{g.tipo || '—'}</td>
                <td>{g.quem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Quem pode entrar no painel (tabela pcpa_autorizados) — só administradores
function Acessos({ sessao }) {
  const [lista, setLista] = useState(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [admin, setAdmin] = useState(false)
  const [msg, setMsg] = useState('')
  const recarregar = () =>
    listarAutorizados()
      .then(setLista)
      .catch((e) => setMsg('Erro ao carregar: ' + e.message))
  useEffect(() => {
    recarregar()
  }, [])
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const acao = async (fn, ok) => {
    setMsg('')
    try {
      await fn()
      setMsg(ok)
      await recarregar()
    } catch (e) {
      setMsg('Não foi possível: ' + (e.message || e))
    }
  }
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-h">
        <div>
          <h2>Quem pode entrar</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            Só os e-mails desta lista conseguem usar o painel. A pessoa entra com a conta Google desse e-mail.
          </div>
        </div>
      </div>
      <div className="card-b">
        <form
          className="acesso-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valido) return
            acao(() => adicionarAutorizado({ email, nome, admin }), `${email.trim()} liberado.`).then(() => {
              setEmail('')
              setNome('')
              setAdmin(false)
            })
          }}
        >
          <input className="select" type="email" placeholder="e-mail@fecaf.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="select" placeholder="Nome ou cargo (ex.: Pró-Reitora Acadêmica)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <label className="toggle">
            <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
            <span className="sw" /> Administrador
          </label>
          <button className="btn primary sm" disabled={!valido}>
            Liberar acesso
          </button>
        </form>
        {msg && <div className="muted" style={{ fontSize: 13, margin: '10px 0' }}>{msg}</div>}
        {lista && (
          <table className="tbl" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Nome</th>
                <th>Perfil</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.email}>
                  <td className="mono">{p.email}</td>
                  <td>{p.nome || '—'}</td>
                  <td>
                    {p.admin ? <span className="tag dim">Administrador</span> : <span className="tag">Avaliadora</span>}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {p.email !== sessao.email && (
                      <>
                        <button
                          className="btn ghost sm"
                          onClick={() => acao(() => atualizarAutorizado(p.email, { admin: !p.admin }), 'Perfil atualizado.')}
                        >
                          {p.admin ? 'Tirar admin' : 'Tornar admin'}
                        </button>
                        <button
                          className="btn ghost sm"
                          onClick={() => {
                            if (confirm(`Remover o acesso de ${p.email}? As escolhas dessa pessoa também serão apagadas.`))
                              acao(() => removerAutorizado(p.email), 'Acesso removido.')
                          }}
                        >
                          Remover
                        </button>
                      </>
                    )}
                    {p.email === sessao.email && <span className="muted" style={{ fontSize: 12 }}>você</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
