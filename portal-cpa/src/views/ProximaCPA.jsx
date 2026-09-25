import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  carregarProposta, iniciarProposta, salvarItem, criarItem, apagarItem, criarQuestionario, mudarStatus, registrar,
  ATUAL_POR_ID, BANCO, MODALIDADES, MOD_CURTO, TIPOS, EIXOS, DIMS, EIXO_DA_DIM, STATUS, TRILHO_PROPOSTA,
  EDITA_CPA, entra, textoNaModalidade, situacao, cobertura,
} from '../lib/proxima.js'
import { fmtInt } from '../lib/cpa.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'

export default function ProximaCPA({ perfil, base }) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [aba, setAba] = useState('montar')
  const [aviso, setAviso] = useState(null)

  const recarregar = useCallback(() => carregarProposta().then(setDados).catch(setErro), [])
  useEffect(() => {
    recarregar()
  }, [recarregar])

  const nomes = useMemo(() => Object.fromEntries(base.usuarios.map((u) => [u.id, u.nome])), [base.usuarios])
  if (erro) return <Erro erro={erro} />
  if (!dados) return <Carregando texto="Abrindo a Próxima CPA…" />

  const ehCpa = EDITA_CPA.includes(perfil.role)
  const ehPr = perfil.role === 'pro_reitoria'
  const { proposta } = dados

  if (!proposta)
    return (
      <div className="card" style={{ alignItems: 'flex-start' }}>
        <div className="eyebrow">Próxima CPA</div>
        <h2>Ainda não existe uma proposta de perguntas.</h2>
        <p className="muted">A proposta começa com as 61 perguntas do instrumento de hoje (2026.1), por questionário e modalidade. A partir daí, vocês mantêm, retiram, reescrevem e acrescentam.</p>
        {ehCpa ? (
          <button className="btn escuro" onClick={async () => { try { await iniciarProposta(perfil.id); await recarregar() } catch (e) { setErro(e) } }}>Começar a proposta</button>
        ) : (
          <p className="muted small">A Coordenação da CPA começa a proposta.</p>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <h3 style={{ fontSize: 20 }}>Perguntas propostas que já esperam por vocês ({BANCO.length})</h3>
          <p className="muted small">Vieram do Perguntas-CPA. Depois de começar a proposta, cada uma pode ser acrescentada com um clique, em qualquer questionário.</p>
          <ListaPropostas />
        </div>
      </div>
    )

  const podeEditar = (ehCpa && ['montagem', 'devolvida'].includes(proposta.status)) || (ehPr && proposta.status === 'pro_reitoria')
  const modo = !podeEditar ? 'leitura' : ehPr ? 'pr' : 'cpa'
  const ctx = { perfil, dados, modo, recarregar, setDados, setAviso, nomes }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Próxima CPA · perguntas e questionários</div>
          <h1>{tituloPorStatus(proposta.status, ehPr)}</h1>
        </div>
      </section>
      <BarraStatus ctx={ctx} />
      {aviso && <div className={'aviso ' + (aviso.tipo || '')} role="status">{aviso.txt}</div>}
      <div className="seg" role="tablist" aria-label="Seções da Próxima CPA">
        {[
          ['montar', modo === 'pr' ? 'Analisar as perguntas' : 'Montar a proposta'],
          ['previa', 'Prévia por modalidade'],
          ['documento', 'Documento para o T.I'],
          ['historico', 'Histórico'],
        ].map(([k, t]) => (
          <button key={k} role="tab" aria-pressed={aba === k} onClick={() => { setAba(k); if (k === 'historico') recarregar() }}>{t}</button>
        ))}
      </div>
      {aba === 'montar' && <Montar ctx={ctx} />}
      {aba === 'previa' && <Previa ctx={ctx} />}
      {aba === 'documento' && <Documento ctx={ctx} />}
      {aba === 'historico' && <Historico ctx={ctx} />}
    </>
  )
}

function tituloPorStatus(s, ehPr) {
  if (s === 'pro_reitoria') return ehPr ? 'A proposta de perguntas chegou para a sua análise.' : 'A proposta está com a Pró-Reitoria.'
  if (s === 'devolvida') return 'A Pró-Reitoria devolveu a proposta com ajustes.'
  if (s === 'aprovada') return 'Proposta aprovada. Pronta para o T.I.'
  if (s === 'enviada_ti') return 'Proposta enviada ao T.I.'
  return 'Montar as perguntas da próxima CPA.'
}

/* ---------------- barra de status e ações principais ---------------- */
function BarraStatus({ ctx }) {
  const { perfil, dados, recarregar, setAviso, nomes } = ctx
  const { proposta, itens } = dados
  const [confirmar, setConfirmar] = useState(null)
  const [coment, setComent] = useState('')
  const ehCpa = EDITA_CPA.includes(perfil.role)
  const ehPr = perfil.role === 'pro_reitoria'
  const cob = cobertura(itens)
  const faltam = Object.entries(cob).filter(([, n]) => n === 0).map(([d]) => d)
  const idx = TRILHO_PROPOSTA.indexOf(proposta.status === 'devolvida' ? 'montagem' : proposta.status)

  const executar = async (patch, acao, msg) => {
    try {
      await mudarStatus(proposta, patch)
      await registrar(proposta.id, perfil.id, acao, patch.comentario_pr ? { comentario: patch.comentario_pr } : {})
      setConfirmar(null)
      setComent('')
      setAviso({ tipo: 'ok', txt: msg })
      await recarregar()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível: ' + (e.message || e) })
    }
  }
  const agora = () => new Date().toISOString()

  return (
    <div className="card" style={{ gap: 14 }}>
      <div className="etapas" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {TRILHO_PROPOSTA.map((s, i) => (
          <div key={s} className="etapa" style={i === idx ? { background: 'var(--navy)', color: '#fff' } : i < idx ? { background: 'var(--green-soft)', color: 'var(--green-ink)' } : undefined}>
            <span className="n">{i < idx ? '✓' : i + 1} · {STATUS[s].t}</span>
            <span className="d">{s === 'pro_reitoria' && proposta.enviado_em ? `enviada por ${nomes[proposta.enviado_por] || '—'} em ${new Date(proposta.enviado_em).toLocaleDateString('pt-BR')}` : s === 'aprovada' && proposta.decidido_em && proposta.status !== 'devolvida' ? `por ${nomes[proposta.decidido_por] || '—'} em ${new Date(proposta.decidido_em).toLocaleDateString('pt-BR')}` : STATUS[s].d}</span>
          </div>
        ))}
      </div>
      {proposta.status === 'devolvida' && proposta.comentario_pr && (
        <div className="aviso erro"><b>Comentário da Pró-Reitoria:</b>&nbsp;{proposta.comentario_pr}</div>
      )}
      <div className="filtros">
        {ehCpa && ['montagem', 'devolvida'].includes(proposta.status) && (
          <button className="btn escuro" onClick={() => setConfirmar('enviar')}>Enviar para a Pró-Reitoria</button>
        )}
        {ehPr && proposta.status === 'pro_reitoria' && (
          <>
            <button className="btn escuro" onClick={() => setConfirmar('aprovar')}>Aprovar a proposta</button>
            <button className="btn" onClick={() => setConfirmar('devolver')}>Devolver com comentário</button>
          </>
        )}
        {ehCpa && proposta.status === 'aprovada' && (
          <button className="btn escuro" onClick={() => setConfirmar('ti')}>Marcar como enviada ao T.I</button>
        )}
        <span className="small muted">
          {fmtInt(itens.filter(entra).length)} perguntas entram · {faltam.length ? `${faltam.length} dimensões sem pergunta` : 'todas as dimensões atendidas ✅'}
        </span>
      </div>

      {confirmar && (
        <div className="modal-fundo" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setConfirmar(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            {confirmar === 'enviar' && (
              <>
                <h2>Enviar para a Pró-Reitoria?</h2>
                <p className="muted">{fmtInt(itens.filter(entra).length)} perguntas entram no instrumento. Enquanto a proposta estiver com a Pró-Reitoria, só ela edita.</p>
                {faltam.length > 0 && <div className="aviso">Ainda sem pergunta: {faltam.map((d) => `D${d} ${DIMS[d]}`).join(', ')}.</div>}
                <div className="filtros">
                  <button className="btn escuro" onClick={() => executar({ status: 'pro_reitoria', enviado_por: perfil.id, enviado_em: agora(), comentario_pr: null }, 'enviou para a Pró-Reitoria', 'Proposta enviada para a Pró-Reitoria.')}>Enviar</button>
                  <button className="btn" onClick={() => setConfirmar(null)}>Cancelar</button>
                </div>
              </>
            )}
            {confirmar === 'aprovar' && (
              <>
                <h2>Aprovar a proposta?</h2>
                <p className="muted">As perguntas que você não reprovou entram no instrumento. A CPA prepara o documento para o T.I.</p>
                <div className="filtros">
                  <button className="btn escuro" onClick={() => executar({ status: 'aprovada', decidido_por: perfil.id, decidido_em: agora() }, 'aprovou a proposta', 'Proposta aprovada.')}>Aprovar</button>
                  <button className="btn" onClick={() => setConfirmar(null)}>Cancelar</button>
                </div>
              </>
            )}
            {confirmar === 'devolver' && (
              <>
                <h2>Devolver para a CPA</h2>
                <div className="campo">
                  <label htmlFor="dev-coment">O que precisa ser ajustado?</label>
                  <textarea id="dev-coment" className="input" rows={4} style={{ height: 'auto', padding: 12 }} value={coment} onChange={(e) => setComent(e.target.value)} />
                </div>
                <div className="filtros">
                  <button className="btn escuro" disabled={!coment.trim()} onClick={() => executar({ status: 'devolvida', decidido_por: perfil.id, decidido_em: agora(), comentario_pr: coment.trim() }, 'devolveu a proposta', 'Proposta devolvida para a CPA.')}>Devolver</button>
                  <button className="btn" onClick={() => setConfirmar(null)}>Cancelar</button>
                </div>
              </>
            )}
            {confirmar === 'ti' && (
              <>
                <h2>Marcar como enviada ao T.I?</h2>
                <p className="muted">Use depois de baixar ou imprimir o documento e enviar para o T.I.</p>
                <div className="filtros">
                  <button className="btn escuro" onClick={() => executar({ status: 'enviada_ti', enviada_ti_em: agora() }, 'marcou como enviada ao T.I', 'Proposta marcada como enviada ao T.I.')}>Confirmar</button>
                  <button className="btn" onClick={() => setConfirmar(null)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- montar / analisar ---------------- */
function Montar({ ctx }) {
  const { dados, modo } = ctx
  const { itens, questionarios } = dados
  const [q, setQ] = useState(questionarios[0]?.id || '')
  const [mod, setMod] = useState('')
  const [verRetiradas, setVerRetiradas] = useState(true)
  const [modal, setModal] = useState(null)

  const contagem = (id) => itens.filter((i) => (i.questionario_id || '') === id && entra(i)).length
  const lista = itens
    .filter((i) => (i.questionario_id || '') === q)
    .filter((i) => !mod || i.modalidades.includes(mod))
    .filter((i) => verRetiradas || entra(i))
    .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
  const semQuest = itens.filter((i) => !i.questionario_id)

  return (
    <section className="grid-lado">
      <div className="coluna">
        <div className="chips" role="tablist" aria-label="Questionários">
          {questionarios.map((x) => (
            <button key={x.id} role="tab" className="chip-btn" aria-selected={q === x.id} onClick={() => setQ(x.id)}>
              {x.nome}{x.origem === 'novo' ? ' (novo)' : ''} · {contagem(x.id)}
            </button>
          ))}
          {semQuest.length > 0 && (
            <button role="tab" className="chip-btn" aria-selected={q === ''} onClick={() => setQ('')}>A definir · {semQuest.filter(entra).length}</button>
          )}
        </div>
        <div className="filtros">
          <div className="seg" role="group" aria-label="Modalidade">
            {[['', 'Todas'], ...MODALIDADES.map((m) => [m, MOD_CURTO[m]])].map(([k, t]) => (
              <button key={k} aria-pressed={mod === k} onClick={() => setMod(k)}>{t}</button>
            ))}
          </div>
          <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={verRetiradas} onChange={(e) => setVerRetiradas(e.target.checked)} /> Mostrar as retiradas
          </label>
        </div>
        {!lista.length && <Vazio>Nenhuma pergunta neste questionário{mod ? ' para ' + MOD_CURTO[mod] : ''}.</Vazio>}
        {lista.map((it, i) => (
          <ItemCard key={it.id} ctx={ctx} item={it} vizinhos={[lista[i - 1], lista[i + 1]]} />
        ))}
      </div>

      <div className="coluna">
        <Gabarito itens={itens} />
        {modo !== 'leitura' && (
          <div className="card">
            <h2>Acrescentar pergunta</h2>
            <p className="muted small">Entra no questionário selecionado ({questionarios.find((x) => x.id === q)?.nome || 'a definir'}).</p>
            <div className="filtros">
              <button className="btn escuro" onClick={() => setModal('banco')}>Das perguntas propostas ({itens.filter((i) => i.banco_id).length} de {BANCO.length} já na proposta)</button>
              <button className="btn" onClick={() => setModal('nova')}>Escrever uma nova</button>
            </div>
            <NovoQuestionario ctx={ctx} onCriado={(id) => setQ(id)} />
          </div>
        )}
      </div>
      {modal === 'banco' && <ModalBanco ctx={ctx} questionarioId={q} onFechar={() => setModal(null)} />}
      {modal === 'nova' && <ModalNova ctx={ctx} questionarioId={q} onFechar={() => setModal(null)} />}
    </section>
  )
}

function ItemCard({ ctx, item, vizinhos }) {
  const { perfil, dados, modo, setDados, setAviso, nomes } = ctx
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(item.texto)
  const [ocupado, setOcupado] = useState(false)
  const s = situacao(item)
  const atual = item.atual_id ? ATUAL_POR_ID[item.atual_id] : null
  const variantes = atual ? Object.entries(atual.variantes || {}) : []

  const salvar = async (patch, acao) => {
    setOcupado(true)
    try {
      const novo = await salvarItem(item, patch, perfil.id)
      setDados((d) => ({ ...d, itens: d.itens.map((x) => (x.id === novo.id ? novo : x)) }))
      if (acao) registrar(dados.proposta.id, perfil.id, acao, { texto: novo.texto }, novo.id)
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível salvar: ' + (e.message || e) })
    } finally {
      setOcupado(false)
    }
  }
  const trocarPosicao = async (outro) => {
    if (!outro) return
    const a = item.posicao ?? 0
    const b = outro.posicao ?? 0
    await salvar({ posicao: b })
    try {
      const n2 = await salvarItem(outro, { posicao: a }, perfil.id)
      setDados((d) => ({ ...d, itens: d.itens.map((x) => (x.id === n2.id ? n2 : x)) }))
    } catch (e) {
      setAviso({ tipo: 'erro', txt: e.message })
    }
  }
  const toggleMod = (m) => {
    const ms = item.modalidades.includes(m) ? item.modalidades.filter((x) => x !== m) : [...item.modalidades, m]
    if (ms.length) salvar({ modalidades: MODALIDADES.filter((x) => ms.includes(x)) }, 'mudou as modalidades')
  }
  const editavel = modo !== 'leitura'
  const apagado = !entra(item)

  return (
    <div className="card" style={{ padding: 20, gap: 12, opacity: apagado ? 0.62 : 1 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span className="pergunta" style={{ display: 'contents' }}><span className="pos">{item.posicao ?? '—'}</span></span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {editando ? (
            <>
              <label className="sr-only" htmlFor={'tx-' + item.id}>Texto da pergunta</label>
              <textarea id={'tx-' + item.id} className="input" rows={3} style={{ height: 'auto', padding: 12, fontSize: 15 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
              <div className="filtros">
                <button className="btn sm escuro" disabled={ocupado || !texto.trim()} onClick={async () => { await salvar({ texto: texto.trim(), ...(modo === 'pr' ? { editada_pr: true } : {}) }, 'reescreveu a pergunta'); setEditando(false) }}>Salvar texto</button>
                <button className="btn sm" onClick={() => { setTexto(item.texto); setEditando(false) }}>Cancelar</button>
                {item.texto_original && texto !== item.texto_original && (
                  <button className="btn sm" onClick={() => setTexto(item.texto_original)}>Voltar ao texto original</button>
                )}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 600, textDecoration: apagado ? 'line-through' : 'none' }}>{item.texto}</p>
          )}
          {item.texto_original && item.texto !== item.texto_original && !editando && (
            <p className="small muted">Texto de hoje: “{item.texto_original}”</p>
          )}
          {variantes.length > 0 && item.texto === item.texto_original && (
            <p className="small muted">Hoje aparece diferente em: {variantes.map(([m, t]) => `${MOD_CURTO[m]} (“${t}”)`).join(', ')}</p>
          )}
          {item.opcoes && <p className="small muted">Opções: {item.opcoes}</p>}
          <div className="chips" style={{ gap: 6 }}>
            <span className={'selo ' + s.c}>{s.t}</span>
            <span className="selo cinza">{TIPOS[item.tipo] || item.tipo}</span>
            {item.origem === 'banco' && <span className="selo cinza">do banco</span>}
            {item.editada_pr && <span className="selo azul">editada pela Pró-Reitoria</span>}
            {item.decisao_pr === 'aprovada' && <span className="selo verde">aprovada pela Pró-Reitoria</span>}
            {item.dimensao ? <span className="selo escuro">Eixo {item.eixo || EIXO_DA_DIM[item.dimensao]} · D{item.dimensao} {DIMS[item.dimensao]}</span> : <span className="selo laranja">sem dimensão</span>}
          </div>
        </div>
      </div>

      <div className="filtros" style={{ gap: 8 }}>
        <div className="seg" role="group" aria-label="Modalidades desta pergunta">
          {MODALIDADES.map((m) => (
            <button key={m} aria-pressed={item.modalidades.includes(m)} disabled={!editavel || ocupado} onClick={() => toggleMod(m)}>{MOD_CURTO[m]}</button>
          ))}
        </div>
        {editavel && (
          <>
            <label className="sr-only" htmlFor={'dim-' + item.id}>Dimensão</label>
            <select id={'dim-' + item.id} className="input" style={{ height: 36, fontSize: 13 }} value={item.dimensao || ''} disabled={ocupado} onChange={(e) => { const d = Number(e.target.value) || null; salvar({ dimensao: d, eixo: d ? EIXO_DA_DIM[d] : null }, 'mudou a dimensão') }}>
              <option value="">Sem dimensão</option>
              {EIXOS.map((e) => (
                <optgroup key={e.n} label={`Eixo ${e.n} · ${e.nome}`}>
                  {e.dims.map((d) => <option key={d} value={d}>D{d} · {DIMS[d]}</option>)}
                </optgroup>
              ))}
            </select>
            <label className="sr-only" htmlFor={'q-' + item.id}>Questionário</label>
            <select id={'q-' + item.id} className="input" style={{ height: 36, fontSize: 13 }} value={item.questionario_id || ''} disabled={ocupado} onChange={(e) => salvar({ questionario_id: e.target.value || null, posicao: 900 }, 'mudou de questionário')}>
              <option value="">Questionário a definir</option>
              {dados.questionarios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
            <button className="btn sm" aria-label="Subir" disabled={ocupado || !vizinhos[0]} onClick={() => trocarPosicao(vizinhos[0])}>↑</button>
            <button className="btn sm" aria-label="Descer" disabled={ocupado || !vizinhos[1]} onClick={() => trocarPosicao(vizinhos[1])}>↓</button>
            {!editando && <button className="btn sm" onClick={() => setEditando(true)}>Editar texto</button>}
          </>
        )}
        <div style={{ flex: 1 }} />
        {modo === 'cpa' && (
          <>
            <button className={'btn sm' + (item.incluida ? '' : ' escuro')} disabled={ocupado} onClick={() => salvar({ incluida: !item.incluida }, item.incluida ? 'retirou a pergunta' : 'manteve a pergunta')}>
              {item.incluida ? 'Retirar' : 'Trazer de volta'}
            </button>
            {item.origem !== 'atual' && (
              <button className="btn sm" disabled={ocupado} onClick={async () => { try { await apagarItem(item); setDados((d) => ({ ...d, itens: d.itens.filter((x) => x.id !== item.id) })); registrar(dados.proposta.id, perfil.id, 'excluiu a pergunta', { texto: item.texto }) } catch (e) { setAviso({ tipo: 'erro', txt: e.message }) } }}>Excluir</button>
            )}
          </>
        )}
        {modo === 'pr' && item.incluida && (
          <>
            <button className={'btn sm' + (item.decisao_pr === 'aprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => salvar({ decisao_pr: item.decisao_pr === 'aprovada' ? null : 'aprovada' }, 'aprovou a pergunta')}>Aprovar</button>
            <button className={'btn sm' + (item.decisao_pr === 'reprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => salvar({ decisao_pr: item.decisao_pr === 'reprovada' ? null : 'reprovada' }, 'reprovou a pergunta')}>Reprovar</button>
          </>
        )}
      </div>
      {item.atualizado_por && <span className="small muted">Última alteração: {nomes[item.atualizado_por] || '—'} · {new Date(item.atualizado_em).toLocaleString('pt-BR')}</span>}
    </div>
  )
}

function Gabarito({ itens }) {
  const cob = cobertura(itens)
  const atendidas = Object.values(cob).filter((n) => n > 0).length
  return (
    <div className="card">
      <div className="card-h">
        <div className="t">
          <h2>Gabarito SINAES</h2>
          <p className="muted small">Perguntas de nota que entram, por dimensão.</p>
        </div>
        <div className="spacer" />
        <span className={'selo ' + (atendidas === 10 ? 'verde' : 'laranja')}>{atendidas}/10 dimensões</span>
      </div>
      {EIXOS.map((e) => {
        const ok = e.dims.every((d) => cob[d] > 0)
        return (
          <div key={e.n} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--line-2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, background: ok ? 'var(--green)' : 'var(--ember-soft)', color: ok ? '#fff' : 'var(--ember-ink)' }}>{ok ? '✓' : '!'}</span>
              <b style={{ fontSize: 14 }}>Eixo {e.n} · {e.nome}</b>
            </div>
            {e.dims.map((d) => (
              <div key={d} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '6px 10px', borderRadius: 10, background: cob[d] ? 'var(--green-soft)' : 'var(--ember-soft)', color: cob[d] ? 'var(--green-ink)' : 'var(--ember-ink)', fontWeight: 600 }}>
                <span>{cob[d] ? '✓' : '✗'} D{d} · {DIMS[d]}</span>
                <span>{cob[d]} {cob[d] === 1 ? 'pergunta' : 'perguntas'}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function NovoQuestionario({ ctx, onCriado }) {
  const { perfil, setDados, setAviso, dados } = ctx
  const [nome, setNome] = useState('')
  return (
    <form
      className="filtros"
      style={{ borderTop: '1px solid var(--line-2)', paddingTop: 14 }}
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          const q = await criarQuestionario(nome, perfil.id)
          setDados((d) => ({ ...d, questionarios: [...d.questionarios, q] }))
          registrar(dados.proposta.id, perfil.id, 'criou um questionário', { nome: q.nome })
          setNome('')
          onCriado(q.id)
        } catch (err) {
          setAviso({ tipo: 'erro', txt: err.message })
        }
      }}
    >
      <label className="sr-only" htmlFor="novo-q">Nome do questionário novo</label>
      <input id="novo-q" className="input" style={{ flex: 1, height: 40, fontSize: 14 }} placeholder="Nome de um questionário novo" value={nome} onChange={(e) => setNome(e.target.value)} />
      <button className="btn sm" disabled={!nome.trim()}>Criar questionário</button>
    </form>
  )
}

function proximaPosicao(itens, qid) {
  return Math.max(0, ...itens.filter((i) => (i.questionario_id || '') === (qid || '')).map((i) => i.posicao || 0)) + 1
}

function ModalBanco({ ctx, questionarioId, onFechar }) {
  const { perfil, dados, modo, setDados, setAviso } = ctx
  const usados = new Set(dados.itens.map((i) => i.banco_id).filter(Boolean))
  const adicionar = async (b) => {
    try {
      const novo = await criarItem({
        proposta_id: dados.proposta.id, origem: 'banco', banco_id: b.id, questionario_id: questionarioId || null,
        posicao: proximaPosicao(dados.itens, questionarioId), texto: b.texto, texto_original: b.texto,
        tipo: ['nota_1a5', 'nota_0a10', 'aberta', 'multipla'].includes(b.tipo) ? b.tipo : 'outro', opcoes: b.opcoes,
        modalidades: MODALIDADES, eixo: b.eixo || (b.dimensao ? EIXO_DA_DIM[b.dimensao] : null), dimensao: b.dimensao,
        incluida: true, adicionada_pr: modo === 'pr',
      }, perfil.id)
      setDados((d) => ({ ...d, itens: [...d.itens, novo] }))
      registrar(dados.proposta.id, perfil.id, 'acrescentou uma pergunta proposta', { texto: b.texto, fonte: b.fonte }, novo.id)
    } catch (e) {
      setAviso({ tipo: 'erro', txt: e.message })
    }
  }
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="banco-t" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 id="banco-t" style={{ flex: 1 }}>Perguntas propostas ({BANCO.length})</h2>
          <button className="btn sm" onClick={onFechar}>Fechar</button>
        </div>
        <ListaPropostas usados={usados} onAcrescentar={adicionar} />
      </div>
    </div>
  )
}

function ModalNova({ ctx, questionarioId, onFechar }) {
  const { perfil, dados, modo, setDados, setAviso } = ctx
  const [f, setF] = useState({ texto: '', tipo: 'nota_1a5', opcoes: '', q: questionarioId || '', mods: [...MODALIDADES], dim: '' })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const salvar = async (e) => {
    e.preventDefault()
    try {
      const dim = Number(f.dim) || null
      const novo = await criarItem({
        proposta_id: dados.proposta.id, origem: 'nova', questionario_id: f.q || null, posicao: proximaPosicao(dados.itens, f.q),
        texto: f.texto.trim(), texto_original: null, tipo: f.tipo, opcoes: f.tipo === 'multipla' ? f.opcoes.trim() || null : null,
        modalidades: f.mods, eixo: dim ? EIXO_DA_DIM[dim] : null, dimensao: dim, incluida: true, adicionada_pr: modo === 'pr',
      }, perfil.id)
      setDados((d) => ({ ...d, itens: [...d.itens, novo] }))
      registrar(dados.proposta.id, perfil.id, 'escreveu uma pergunta nova', { texto: novo.texto }, novo.id)
      onFechar()
    } catch (err) {
      setAviso({ tipo: 'erro', txt: err.message })
    }
  }
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="nova-t" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={salvar}>
        <h2 id="nova-t">Pergunta nova</h2>
        <div className="campo">
          <label htmlFor="nv-t">Texto da pergunta</label>
          <textarea id="nv-t" className="input" rows={3} style={{ height: 'auto', padding: 12 }} required value={f.texto} onChange={(e) => set('texto', e.target.value)} />
        </div>
        <div className="grid2" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div className="campo">
            <label htmlFor="nv-tipo">Tipo de resposta</label>
            <select id="nv-tipo" className="input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {Object.entries(TIPOS).filter(([k]) => k !== 'outro').map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="nv-q">Questionário</label>
            <select id="nv-q" className="input" value={f.q} onChange={(e) => set('q', e.target.value)}>
              <option value="">A definir</option>
              {dados.questionarios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
          </div>
        </div>
        {f.tipo === 'multipla' && (
          <div className="campo">
            <label htmlFor="nv-op">Opções (separe com |)</label>
            <input id="nv-op" className="input" value={f.opcoes} onChange={(e) => set('opcoes', e.target.value)} />
          </div>
        )}
        <div className="campo">
          <label htmlFor="nv-dim">Eixo e dimensão</label>
          <select id="nv-dim" className="input" value={f.dim} onChange={(e) => set('dim', e.target.value)}>
            <option value="">Sem dimensão (ex.: pergunta aberta)</option>
            {EIXOS.map((e) => (
              <optgroup key={e.n} label={`Eixo ${e.n} · ${e.nome}`}>
                {e.dims.map((d) => <option key={d} value={d}>D{d} · {DIMS[d]}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: 16 }}>
          <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Modalidades</legend>
          {MODALIDADES.map((m) => (
            <label key={m} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={f.mods.includes(m)} onChange={(e) => set('mods', e.target.checked ? MODALIDADES.filter((x) => [...f.mods, m].includes(x)) : f.mods.filter((x) => x !== m))} />
              {MOD_CURTO[m]}
            </label>
          ))}
        </fieldset>
        <div className="filtros">
          <button className="btn escuro" disabled={!f.texto.trim() || !f.mods.length}>Acrescentar</button>
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- prévia por modalidade ---------------- */
function Previa({ ctx }) {
  const { dados } = ctx
  const { itens, questionarios } = dados
  const [q, setQ] = useState(questionarios[0]?.id || '')
  const doQ = itens.filter((i) => i.questionario_id === q && entra(i)).sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
  const nome = questionarios.find((x) => x.id === q)?.nome
  return (
    <>
      <div className="chips" role="tablist" aria-label="Questionários">
        {questionarios.map((x) => (
          <button key={x.id} role="tab" className="chip-btn" aria-selected={q === x.id} onClick={() => setQ(x.id)}>{x.nome}</button>
        ))}
      </div>
      <p className="small muted">Como o aluno de cada modalidade vai ver o questionário “{nome}”. É uma aproximação: a tela real é a da plataforma da pesquisa.</p>
      <div className="grid3" style={{ alignItems: 'start' }}>
        {MODALIDADES.map((m) => {
          const lista = doQ.filter((i) => i.modalidades.includes(m))
          return (
            <div key={m} className="card" style={{ padding: 20, gap: 14 }}>
              <div className="card-h"><div className="t"><span className="eyebrow">{MOD_CURTO[m]}</span><h3>{nome}</h3></div><div className="spacer" /><span className="selo cinza">{lista.length}</span></div>
              {!lista.length && <Vazio>Este questionário não aparece para {MOD_CURTO[m]}.</Vazio>}
              {lista.map((it, i) => (
                <div key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.45 }}>{i + 1}. {textoNaModalidade(it, m)}</p>
                  <Resposta item={it} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Resposta({ item }) {
  if (item.tipo === 'aberta') return <div style={{ height: 56, borderRadius: 10, border: '1px solid #c9d6e3', background: 'var(--paper-2)' }} aria-hidden="true" />
  if (item.tipo === 'multipla' || item.tipo === 'outro')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-hidden="true">
        {(item.opcoes || 'Opção 1 | Opção 2').split('|').map((o, i) => (
          <span key={i} className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #9aa3b2' }} />{o.trim()}</span>
        ))}
      </div>
    )
  const valores = item.tipo === 'nota_0a10' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5]
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} aria-hidden="true">
      {valores.map((v) => (
        <span key={v} style={{ minWidth: 28, height: 28, borderRadius: 8, border: '1px solid #c9d6e3', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{v}</span>
      ))}
    </div>
  )
}

/* ---------------- documento para o T.I ---------------- */
function Documento({ ctx }) {
  const { dados, nomes } = ctx
  const { itens, questionarios, proposta } = dados
  const semQ = itens.filter((i) => !i.questionario_id && entra(i))
  return (
    <div className="card" style={{ gap: 20 }}>
      <div className="card-h no-print">
        <div className="t">
          <h2>Documento para o T.I</h2>
          <p className="muted small">Textos literais, questionário por questionário e modalidade por modalidade. Use “Imprimir / PDF” para enviar.</p>
        </div>
        <div className="spacer" />
        <button className="btn escuro" onClick={() => window.print()}>Imprimir / PDF</button>
      </div>
      {proposta.status !== 'aprovada' && proposta.status !== 'enviada_ti' && (
        <div className="aviso no-print">Prévia do documento: a proposta ainda não foi aprovada pela Pró-Reitoria.</div>
      )}
      <div>
        <h2 style={{ fontSize: 30 }}>Instrumento da próxima CPA</h2>
        <p className="muted small">
          Situação: {STATUS[proposta.status].t}
          {proposta.decidido_em && proposta.status !== 'devolvida' ? ` · aprovada por ${nomes[proposta.decidido_por] || '—'} em ${new Date(proposta.decidido_em).toLocaleDateString('pt-BR')}` : ''}
        </p>
      </div>
      {semQ.length > 0 && <div className="aviso">{semQ.length} pergunta(s) ainda sem questionário definido.</div>}
      {questionarios.map((q) => {
        const doQ = itens.filter((i) => i.questionario_id === q.id).sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
        const ficam = doQ.filter(entra)
        const saem = doQ.filter((i) => !entra(i))
        if (!doQ.length) return null
        return (
          <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, breakInside: 'avoid' }}>
            <h3 style={{ fontSize: 22, borderBottom: '2px solid var(--line)', paddingBottom: 6 }}>{q.nome}{q.origem === 'novo' ? ' (questionário novo)' : ''}</h3>
            {MODALIDADES.map((m) => {
              const lista = ficam.filter((i) => i.modalidades.includes(m))
              if (!lista.length) return null
              return (
                <div key={m} className="rolagem">
                  <table className="tabela">
                    <thead><tr><th style={{ width: 36 }}>Nº</th><th>{MOD_CURTO[m]} · pergunta (texto literal)</th><th style={{ width: 150 }}>Resposta</th><th style={{ width: 150 }}>Situação</th></tr></thead>
                    <tbody>
                      {lista.map((it, i) => (
                        <tr key={it.id}>
                          <td>{i + 1}</td>
                          <td>{textoNaModalidade(it, m)}{it.opcoes ? <div className="small muted">Opções: {it.opcoes}</div> : null}</td>
                          <td>{TIPOS[it.tipo]}</td>
                          <td>{situacao(it).t}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {saem.length > 0 && (
              <p className="small muted">Saem deste questionário: {saem.map((i) => `“${i.texto}”`).join('; ')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Historico({ ctx }) {
  const { dados, nomes } = ctx
  if (!dados.historico.length) return <Vazio>Nenhuma alteração registrada ainda.</Vazio>
  return (
    <div className="card">
      <div className="lista">
        {dados.historico.map((h) => (
          <div key={h.id} className="item" style={{ alignItems: 'flex-start' }}>
            <span className="small muted" style={{ width: 150, flexShrink: 0 }}>{new Date(h.em).toLocaleString('pt-BR')}</span>
            <span><b>{nomes[h.usuario_id] || '—'}</b> {h.acao}{h.detalhe?.texto ? `: “${h.detalhe.texto}”` : ''}{h.detalhe?.comentario ? `: “${h.detalhe.comentario}”` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// As perguntas propostas (do Perguntas-CPA), com filtro por dimensão e busca
function ListaPropostas({ usados, onAcrescentar }) {
  const [busca, setBusca] = useState('')
  const [dim, setDim] = useState('')
  const lista = BANCO.filter((b) => (!dim || String(b.dimensao) === dim) && (!busca || b.texto.toLowerCase().includes(busca.toLowerCase())))
  return (
    <>
      <div className="filtros">
        <label className="sr-only" htmlFor="bd">Dimensão</label>
        <select id="bd" className="input" value={dim} onChange={(e) => setDim(e.target.value)}>
          <option value="">Todas as dimensões</option>
          {Object.entries(DIMS).map(([d, n]) => <option key={d} value={d}>D{d} · {n}</option>)}
        </select>
        <label className="sr-only" htmlFor="bb">Buscar</label>
        <input id="bb" type="search" className="input" placeholder="Buscar no texto" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lista.map((b) => (
          <div key={b.id} className="coment" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontWeight: 600 }}>{b.texto}</p>
              <div className="meta">
                <span className="selo cinza">{TIPOS[b.tipo] || b.tipo}</span>
                {b.dimensao && <span className="selo escuro">D{b.dimensao} · {DIMS[b.dimensao]}</span>}
                {b.ja_existe && <span>Já existe hoje? {b.ja_existe}</span>}
              </div>
              {b.observacao && <span className="small muted">{b.observacao}</span>}
            </div>
            {onAcrescentar && (usados?.has(b.id) ? <span className="selo verde">já na proposta</span> : <button className="btn sm escuro" onClick={() => onAcrescentar(b)}>Acrescentar</button>)}
          </div>
        ))}
        {!lista.length && <Vazio>Nada encontrado.</Vazio>}
      </div>
    </>
  )
}
