import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, STATUS_PLANO, TRILHO, GLOBAL_SUPERVISOR_ROLES } from '../lib/config.js'
import { rotuloCurso, contarTrilho } from '../lib/escopo.js'
import { fmtInt, fmtNota } from '../lib/cpa.js'
import { buscarComentarios } from '../lib/dados.js'
import { urgencia } from '../lib/planos.js'
import { Vazio } from '../components/ui.jsx'
import BotoesPdf from '../components/BotoesPdf.jsx'
import FormPlano from '../components/FormPlano.jsx'
import ItemPlano from '../components/ItemPlano.jsx'
import { ESCREVE_PLANO, SELO_STATUS, fmtData, autorRotulo, seloPrazo } from '../lib/planos.js'


export default function Planos(props) {
  const { perfil, base, planos, param, recarregarBase, escopo, aoEnviarPlano } = props
  const meus = useMemo(() => base.planos.filter((p) => p.usuario_id === perfil.id), [base.planos, perfil.id])
  const equipe = useMemo(() => {
    if (perfil.role !== 'coordenador') return []
    const aux = new Set(base.usuarios.filter((u) => u.role === 'professor_auxiliar').map((u) => u.id))
    return base.planos.filter((p) => aux.has(p.usuario_id) && p.curso_id && perfil.cursos.includes(p.curso_id))
  }, [base.planos, base.usuarios, perfil])
  const supervisor = GLOBAL_SUPERVISOR_ROLES.includes(perfil.role)
  const podeEscrever = ESCREVE_PLANO.includes(perfil.role) && perfil.cursos.length > 0

  const abas = [
    ...(podeEscrever || meus.length ? [{ k: 'meus', t: `Meus planos (${meus.length})` }] : []),
    ...(equipe.length ? [{ k: 'equipe', t: `Planos da equipe (${equipe.filter((p) => p.status === 'aguardando_coordenador').length} para revisar)` }] : []),
    ...(supervisor ? [{ k: 'acompanhamento', t: 'Acompanhamento' }] : []),
    { k: 'todos', t: 'Todos os planos' },
  ]
  const [aba, setAba] = useState(abas.some((a) => a.k === param) ? param : abas[0].k)
  const [aviso, setAviso] = useState(null)
  const mudou = (msg) => {
    if (msg) setAviso(msg)
    recarregarBase()
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Planos de ação</div>
          <h1>{fmtInt(planos.length)} planos, do envio à conclusão.</h1>
          <p className="muted">Sem rascunho: ao enviar, o plano já segue para a análise. Quem enviou pode editar até a aprovação.</p>
        </div>
      </div>
      <div className="seg" role="tablist" style={{ flexWrap: 'wrap', alignSelf: 'flex-start' }}>
        {abas.map((a) => (
          <button key={a.k} role="tab" aria-pressed={aba === a.k} onClick={() => { setAba(a.k); setAviso(null) }}>{a.t}</button>
        ))}
      </div>
      {aviso && <div className="aviso ok" role="status">{aviso}</div>}
      <BotoesPdf tipos={[...(perfil.role !== 'setor' && perfil.role !== 'diretor_nucleo_setor' ? ['meuPlano'] : []), ...(perfil.global ? ['planos'] : [])]} base={base} perfil={perfil} escopo={escopo} />
      {aba === 'meus' && <MeusPlanos {...{ perfil, base, meus, podeEscrever, mudou, aoEnviarPlano }} />}
      {aba === 'equipe' && <Equipe {...{ perfil, base, equipe, mudou }} />}
      {aba === 'acompanhamento' && <Acompanhamento {...{ perfil, base, planos, mudou }} />}
      {aba === 'todos' && <Todos {...{ perfil, base, planos, param, mudou }} />}
    </>
  )
}

function agrupar(lista, chave) {
  const g = new Map()
  for (const p of lista) {
    const k = chave(p)
    if (!g.has(k)) g.set(k, [])
    g.get(k).push(p)
  }
  return [...g.entries()]
}

function MeusPlanos({ perfil, base, meus, podeEscrever, mudou, aoEnviarPlano }) {
  const [novo, setNovo] = useState(meus.length === 0)
  const grupos = agrupar(meus, (p) => p.categoria || 'Sem questionário vinculado')
  return (
    <>
      {podeEscrever && (
        novo ? (
          <FormPlano perfil={perfil} base={base} escopo={base.cursos.filter((c) => perfil.cursos.includes(c.id))}
            onEnviado={() => { aoEnviarPlano?.(); mudou('Plano enviado.') }} />
        ) : (
          <button className="btn escuro" style={{ alignSelf: 'flex-start' }} onClick={() => setNovo(true)}>+ Novo plano</button>
        )
      )}
      <p className="small muted">Você também pode escrever o plano direto em cada questionário, com os comentários dos alunos ao lado.</p>
      {grupos.length === 0 && <Vazio>Nenhum item registrado ainda.</Vazio>}
      {grupos.map(([cat, itens]) => (
        <section key={cat} className="card" style={{ gap: 10 }}>
          <h3 style={{ fontSize: 20 }}>{cat} <span className="muted small">({itens.length})</span></h3>
          {itens.map((p) => <ItemPlano key={p.id} p={p} perfil={perfil} base={base} onMudou={mudou} />)}
        </section>
      ))}
    </>
  )
}

function Equipe({ perfil, base, equipe, mudou }) {
  const pendentes = equipe.filter((p) => p.status === 'aguardando_coordenador')
  const fila = equipe.filter((p) => p.status === 'enviado' || p.status === 'rascunho')
  const revisados = equipe.filter((p) => !['aguardando_coordenador', 'enviado', 'rascunho'].includes(p.status))
  return (
    <>
      <p className="muted">Planos dos professores auxiliares e coordenadores adjuntos dos seus cursos. Revise, edite ou exclua; quando estiver tudo certo, clique em "Aprovar e enviar para validação".</p>
      <Secao t={`Aguardando sua revisão (${pendentes.length})`} itens={pendentes} {...{ perfil, base, mudou }} vazio="Nada esperando a sua revisão agora." />
      {fila.length > 0 && <Secao t={`Já enviados para validação · ainda dá para puxar de volta (${fila.length})`} itens={fila} {...{ perfil, base, mudou }} />}
      {revisados.length > 0 && <Secao t={`Já revisados (${revisados.length})`} itens={revisados} {...{ perfil, base, mudou }} />}
    </>
  )
}

function Secao({ t, itens, perfil, base, mudou, vazio, contexto }) {
  return (
    <section className="card" style={{ gap: 10 }}>
      <h3 style={{ fontSize: 20 }}>{t}</h3>
      {itens.length === 0 && <Vazio>{vazio || 'Nenhum item.'}</Vazio>}
      {itens.map((p) => <ItemPlano key={p.id} p={p} perfil={perfil} base={base} onMudou={mudou} contexto={contexto ? <Contexto p={p} base={base} /> : null} />)}
    </section>
  )
}

// Acompanhamento da supervisão: uma linha por pessoa (coordenação) e por setor, com os pendentes
function Acompanhamento({ perfil, base, planos, mudou }) {
  const [aberto, setAberto] = useState(null)
  const porUsuario = useMemo(() => Object.fromEntries(base.usuarios.map((u) => [u.id, u])), [base.usuarios])
  const pend = (l) => l.filter((p) => ['enviado', 'rascunho', 'aguardando_pro_reitoria'].includes(p.status)).length
  const montar = (lista) =>
    agrupar(lista.filter((p) => p.usuario_id !== perfil.id), (p) => p.usuario_id)
      .map(([id, itens]) => ({ id, u: porUsuario[id], itens, pendentes: pend(itens) }))
      .sort((a, b) => b.pendentes - a.pendentes || b.itens.length - a.itens.length)
  const cursos = montar(planos.filter((p) => p.tipo !== 'setor'))
  const setores = montar(base.planos.filter((p) => p.tipo === 'setor'))

  if (aberto) {
    const c = [...cursos, ...setores].find((x) => x.id === aberto)
    if (c) {
      const setor = c.itens[0]?.tipo === 'setor'
      return (
        <>
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAberto(null)}>← Voltar para a lista</button>
          {setor ? <SaudeSetor base={base} setorId={c.itens[0].setor_id} /> : <SaudeCurso base={base} cursoId={c.itens[0]?.curso_id} />}
          <Secao t={`${setor ? base.setores.find((s) => s.id === c.itens[0].setor_id)?.nome || 'Setor' : c.u?.nome || 'Autor'} · ${c.itens.length} item(ns)`}
            itens={[...c.itens].sort((a, b) => urgencia(a) - urgencia(b))} {...{ perfil, base, mudou }} contexto />
        </>
      )
    }
  }
  const Linha = ({ c, nome, sub }) => (
    <button className="plano-item" onClick={() => setAberto(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <span className="av" aria-hidden="true" style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--track)', display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0 }}>
        {(nome || '?').split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
      </span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <b>{nome}</b>
        <span className="small muted">{sub}</span>
      </span>
      <span className={'selo ' + (c.pendentes ? 'laranja' : 'cinza')} title="Itens esperando análise">{c.pendentes}</span>
    </button>
  )
  return (
    <>
      <section className="card" style={{ gap: 10 }}>
        <h3 style={{ fontSize: 20 }}>Cursos sob sua supervisão</h3>
        {cursos.length === 0 && <Vazio>Nenhum plano de ação registrado pelos coordenadores deste recorte ainda.</Vazio>}
        {cursos.map((c) => (
          <Linha key={c.id} c={c} nome={c.u?.nome || 'Autor não encontrado'}
            sub={`${c.itens.length} item(ns) · ${[...new Set(c.itens.map((p) => rotuloCurso(base.cursos.find((x) => x.id === p.curso_id))))].join(', ')}`} />
        ))}
      </section>
      <section className="card" style={{ gap: 10 }}>
        <h3 style={{ fontSize: 20 }}>Planos de melhoria de infraestrutura (setores)</h3>
        {setores.length === 0 && <Vazio>Nenhum plano de melhoria de infraestrutura registrado ainda.</Vazio>}
        {setores.map((c) => {
          const nome = base.setores.find((s) => s.id === c.itens[0]?.setor_id)?.nome || c.u?.nome || 'Setor'
          return <Linha key={c.id} c={c} nome={nome} sub={`${c.itens.length} item(ns) registrado(s)`} />
        })}
      </section>
    </>
  )
}

function SaudeCurso({ base, cursoId }) {
  const n = base.notas[cursoId]
  if (!n) return null
  const dims = DIMENSOES.filter((d) => n[d] != null).sort((a, b) => n[b] - n[a])
  const curso = base.cursos.find((c) => c.id === cursoId)
  return (
    <div className="card" style={{ gap: 10 }}>
      <span className="eyebrow">Saúde do curso · {rotuloCurso(curso)}</span>
      <div className="grid3">
        <div className="kpi"><span className="v">{fmtNota(n[SATISFACAO], 1)}</span><span className="l">Satisfação Geral (0 a 10)</span></div>
        <div className="kpi"><span className="v" style={{ fontSize: 20 }}>{dims[0]}</span><span className="l">Ponto forte · {fmtNota(n[dims[0]])}</span></div>
        <div className="kpi"><span className="v" style={{ fontSize: 20 }}>{dims[dims.length - 1]}</span><span className="l">Oportunidade · {fmtNota(n[dims[dims.length - 1]])}</span></div>
      </div>
    </div>
  )
}

function SaudeSetor({ base, setorId }) {
  const s = base.setores.find((x) => x.id === setorId)
  if (!s) return null
  const [pior] = base.setorPerguntas.filter((p) => p.setor_id === setorId).sort((a, b) => Number(a.nota) - Number(b.nota))
  return (
    <div className="card" style={{ gap: 10 }}>
      <span className="eyebrow">Saúde do setor · {s.nome}</span>
      <div className="grid3">
        <div className="kpi"><span className="v">{fmtNota(s.nota)}</span><span className="l">Nota geral</span></div>
        {pior && <div className="kpi"><span className="v" style={{ fontSize: 20 }}>{pior.pergunta}</span><span className="l">Ponto mais frágil · {fmtNota(pior.nota)}</span></div>}
      </div>
    </div>
  )
}

// Contexto que originou o plano: nota da dimensão e até 2 comentários críticos
function Contexto({ p, base }) {
  const [coments, setComents] = useState({ chave: null, lista: [] })
  const n = base.notas[p.curso_id] || {}
  const cat = p.categoria && n[p.categoria] != null ? p.categoria : DIMENSOES.filter((d) => n[d] != null).sort((a, b) => n[a] - n[b])[0]
  const chave = p.tipo === 'setor' ? null : `${p.curso_id}|${cat}`
  useEffect(() => {
    if (!chave) return
    let vivo = true
    buscarComentarios({ cursos: [p.curso_id], categoria: cat, sentimento: 'bad', porPagina: 2 })
      .then((r) => vivo && setComents({ chave, lista: r.itens }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [chave, p.curso_id, cat])
  if (p.tipo === 'setor') {
    const [pior] = base.setorPerguntas.filter((x) => x.setor_id === p.setor_id).sort((a, b) => Number(a.nota) - Number(b.nota))
    if (!pior) return null
    return <div className="aviso small"><span><b>{pior.pergunta}:</b> nota {fmtNota(pior.nota)} de 5 (ponto mais frágil do setor)</span></div>
  }
  if (!cat) return null
  return (
    <div className="aviso" style={{ flexDirection: 'column', gap: 4 }}>
      <b className="small">Contexto que originou este plano</b>
      <span className="small"><b>{cat}:</b> nota {fmtNota(n[cat], cat === SATISFACAO ? 1 : 2)} de {cat === SATISFACAO ? 10 : 5}</span>
      {coments.chave === chave && coments.lista.map((c) => <span key={c.id} className="small" style={{ fontStyle: 'italic' }}>"{c.texto}"</span>)}
    </div>
  )
}

function Todos({ perfil, base, planos, param, mudou }) {
  const [status, setStatus] = useState(TRILHO.includes(param) || param === 'devolvido' ? param : '')
  const [dim, setDim] = useState('')
  const [curso, setCurso] = useState('')
  const [busca, setBusca] = useState('')
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const { c: trilho, devolvidos } = contarTrilho(planos)
  const cursosComPlano = [...new Set(planos.map((p) => p.curso_id).filter(Boolean))].map((id) => porId[id]).filter(Boolean).sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b)))

  const lista = planos.filter((p) => {
    const st = p.status === 'rascunho' ? 'enviado' : p.status
    if (status && st !== status) return false
    if (dim && !(p.categoria || '').split(', ').includes(dim)) return false
    if (curso && p.curso_id !== curso) return false
    if (busca && !`${p.titulo} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <>
      <div className="etapas">
        {TRILHO.map((s, i) => (
          <button key={s} className={'etapa e' + (i + 1)} aria-pressed={status === s} onClick={() => setStatus(status === s ? '' : s)}>
            <span className="n">{i + 1} · {STATUS_PLANO[s]}</span>
            <span className="q">{fmtInt(trilho[s])}</span>
          </button>
        ))}
      </div>
      <div className="card">
        <div className="filtros">
          {devolvidos > 0 && (
            <button className="chip-btn" aria-pressed={status === 'devolvido'} onClick={() => setStatus(status === 'devolvido' ? '' : 'devolvido')}>
              Devolvidos para ajuste ({fmtInt(devolvidos)})
            </button>
          )}
          <label className="sr-only" htmlFor="p-dim">Dimensão</label>
          <select id="p-dim" className="input" value={dim} onChange={(e) => setDim(e.target.value)}>
            <option value="">Todas as dimensões</option>
            {[...DIMENSOES, SATISFACAO].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {cursosComPlano.length > 1 && (
            <>
              <label className="sr-only" htmlFor="p-curso">Curso</label>
              <select id="p-curso" className="input" value={curso} onChange={(e) => setCurso(e.target.value)} style={{ minWidth: 260 }}>
                <option value="">Todos os cursos</option>
                {cursosComPlano.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
              </select>
            </>
          )}
          <label className="sr-only" htmlFor="p-busca">Buscar</label>
          <input id="p-busca" type="search" className="input" placeholder="Buscar no título ou na descrição" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <span className="small muted">{fmtInt(lista.length)} planos</span>
          {(status || dim || curso || busca) && (
            <button className="btn sm" onClick={() => { setStatus(''); setDim(''); setCurso(''); setBusca('') }}>Limpar filtros</button>
          )}
        </div>
        <ListaPlanos planos={lista} base={base} perfil={perfil} onMudou={mudou} />
      </div>
    </>
  )
}

export function ListaPlanos({ planos, base, compacto, perfil, onMudou }) {
  const [abertoId, setAbertoId] = useState(null)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s])), [base.setores])
  const porUsuario = useMemo(() => Object.fromEntries(base.usuarios.map((u) => [u.id, u])), [base.usuarios])
  if (!planos.length) return <Vazio>Nenhum plano por aqui.</Vazio>
  const alvo = (p) => (p.tipo === 'setor' ? porSetor[p.setor_id]?.nome || p.setor_id : rotuloCurso(porCurso[p.curso_id]))
  // Depois de uma ação, mostra a versão atualizada do plano (ou fecha, se ele foi excluído)
  const aberto = abertoId && (base.planos.find((p) => p.id === abertoId) || planos.find((p) => p.id === abertoId))
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {planos.map((p) => {
          const prazo = seloPrazo(p)
          return (
            <button key={p.id} className="plano-item" onClick={() => setAbertoId(p.id)}>
              <b>{p.titulo}</b>
              <div className="chips" style={{ gap: 6 }}>
                <span className={'selo ' + SELO_STATUS[p.status]}>{STATUS_PLANO[p.status === 'rascunho' ? 'enviado' : p.status] || p.status}</span>
                {p.categoria && <span className="selo cinza">{p.categoria}</span>}
                {p.prioridade && !compacto && <span className="selo cinza">Prioridade {p.prioridade.toLowerCase()}</span>}
                {prazo && prazo.c !== 'verde' && <span className={'selo ' + prazo.c}>{prazo.t}</span>}
              </div>
              {!compacto && (
                <span className="small muted">
                  {alvo(p)} · {porUsuario[p.usuario_id]?.nome || 'autor não encontrado'}
                  {p.prazo && ` · prazo ${fmtData(p.prazo)}`}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {aberto && (
        <DetalhePlano p={aberto} alvo={alvo(aberto)} autor={porUsuario[aberto.usuario_id]} base={base} perfil={perfil}
          onMudou={(m) => { onMudou?.(m); if (m === 'Item excluído.') setAbertoId(null) }} onFechar={() => setAbertoId(null)} />
      )}
    </>
  )
}

function DetalhePlano({ p, alvo, autor, base, perfil, onMudou, onFechar }) {
  const st = p.status === 'rascunho' ? 'enviado' : p.status
  const idx = TRILHO.indexOf(st)
  const passos = [
    { s: 'enviado', t: 'Enviado', info: fmtData(p.criado_em) && `em ${fmtData(p.criado_em)}` },
    { s: 'aguardando_coordenador', t: 'Revisão do coordenador', info: p.enviado_coordenador_em ? `enviado em ${fmtData(p.enviado_coordenador_em)}` : 'quando o plano é de alguém da equipe' },
    { s: 'aguardando_pro_reitoria', t: 'Pró-Reitoria', info: p.validado_por ? `validado por ${p.validado_por}` : null },
    { s: 'aprovado', t: 'Aprovado', info: p.revisado_por && ['aprovado', 'concluido'].includes(st) ? `por ${p.revisado_por}${p.revisado_em ? ' em ' + fmtData(p.revisado_em) : ''}` : null },
    { s: 'concluido', t: 'Concluído', info: p.data_conclusao ? `em ${fmtData(p.data_conclusao)}` : null },
  ]
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="plano-titulo" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="small muted">{alvo} · {autorRotulo(autor)}</span>
            <h2 id="plano-titulo" style={{ fontSize: 28, lineHeight: 1.15 }}>{p.titulo}</h2>
          </div>
          <button className="btn sm" onClick={onFechar}>Fechar</button>
        </div>
        <div className="grid-plano">
          {perfil ? <ItemPlano p={p} perfil={perfil} base={base} onMudou={onMudou} /> : <p style={{ whiteSpace: 'pre-line' }}>{p.descricao}</p>}
          <div className="passos" aria-label="Trilho de aprovação">
            {p.status === 'devolvido' && <div className="aviso erro" style={{ marginBottom: 12 }}>Devolvido para ajuste</div>}
            {passos.map((x, i) => {
              const cls = p.status === 'devolvido' ? (i === 0 ? 'feito' : '') : i < idx || st === 'concluido' ? 'feito' : i === idx ? 'atual' : ''
              return (
                <div key={x.s} className={'passo ' + cls}>
                  <div className="col">
                    <span className="bola">{cls === 'feito' ? '✓' : i + 1}</span>
                    {i < passos.length - 1 && <span className="fio" />}
                  </div>
                  <div className="info">
                    <b>{x.t}</b>
                    {x.info && <span className="small muted">{x.info}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
