import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, MODALIDADE_LABEL, SATISFACAO } from '../lib/config.js'
import { fmtNota } from '../lib/cpa.js'
import { rotuloCurso } from '../lib/escopo.js'
import { PRIORIDADES, fmtData } from '../lib/planos.js'
import {
  NUCLEO_LABELS,
  criarAcaoDirecao,
  cursosDoNucleo,
  editarAcaoDirecao,
  excluirAcaoDirecao,
  listarAcoesDirecao,
  nomeNucleo,
  nucleosDeCursos,
  porStatus,
  validarAcao,
} from '../lib/nucleo.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'
import ItemPlano, { Modal } from '../components/ItemPlano.jsx'
import { ListaComentarios } from './Comentarios.jsx'
import './nucleo.css'

const POR_VEZ = 20

// Aba do núcleo. Diretor(a) de núcleo: cursos do núcleo, planos dos coordenadores e ações da direção.
// Pró-Reitoria, CPA, Comissão e admin: a mesma visão, escolhendo o núcleo, com as ações da direção só para leitura.
export default function Nucleo({ perfil, base, recarregarBase }) {
  const diretor = perfil.role === 'diretor_nucleo'
  const [nucleos, setNucleos] = useState(diretor ? [perfil.nucleo].filter(Boolean) : null)
  const [nucleo, setNucleo] = useState(diretor ? perfil.nucleo : '')
  const [cursosNucleo, setCursosNucleo] = useState({ nucleo: null, ids: diretor ? perfil.nucleoCursos : [] })
  const [erro, setErro] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (diretor) return
    let vivo = true
    nucleosDeCursos()
      .then((l) => {
        if (!vivo) return
        const ord = l.sort((a, b) => nomeNucleo(a).localeCompare(nomeNucleo(b)))
        setNucleos(ord)
        setNucleo((n) => n || ord[0] || '')
      })
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [diretor])

  useEffect(() => {
    if (diretor || !nucleo) return
    let vivo = true
    cursosDoNucleo(nucleo)
      .then((ids) => vivo && setCursosNucleo({ nucleo, ids }))
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [diretor, nucleo])

  if (diretor && !perfil.nucleo) return <Vazio>Seu usuário ainda não está vinculado a um núcleo. Peça a correção para a Coordenação da CPA.</Vazio>
  if (erro) return <Erro erro={erro} />
  if (!nucleos) return <Carregando texto="Carregando os núcleos…" />
  if (!diretor && cursosNucleo.nucleo !== nucleo) return <Carregando texto="Carregando os cursos do núcleo…" />

  const ids = cursosNucleo.ids
  const mudou = (t) => {
    setMsg(t || null)
    return recarregarBase()
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">{diretor ? 'Direção de núcleo' : 'Núcleos'}</div>
          <h1>Cursos do {nomeNucleo(nucleo)}</h1>
        </div>
      </div>
      {!diretor && nucleos.length > 1 && (
        <div className="filtros">
          <div className="seg" role="group" aria-label="Núcleo">
            {nucleos.map((n) => (
              <button key={n} aria-pressed={nucleo === n} onClick={() => setNucleo(n)}>{NUCLEO_LABELS[n] || n}</button>
            ))}
          </div>
        </div>
      )}
      {msg && <div className="aviso ok" role="status">{msg}</div>}

      <CursosDoNucleo base={base} ids={ids} perfil={perfil} />
      <PlanosCoordenadores base={base} ids={ids} perfil={perfil} onMudou={mudou} />
      <AcoesDirecao key={nucleo} base={base} ids={ids} perfil={perfil} diretor={diretor} />
    </>
  )
}

function CursosDoNucleo({ base, ids, perfil }) {
  const [aberto, setAberto] = useState(null)
  const cursos = base.cursos.filter((c) => ids.includes(c.id)).sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b)))
  if (!cursos.length) return <Vazio>Nenhum curso cadastrado neste núcleo.</Vazio>
  return (
    <div className="nu-auto">
      {cursos.map((c) => {
        const n = base.notas[c.id] || {}
        const dims = DIMENSOES.filter((d) => n[d] != null).sort((a, b) => n[b] - n[a])
        const forte = dims[0]
        const fraca = dims[dims.length - 1]
        const coordena = perfil.cursos.includes(c.id)
        return (
          <div key={c.id} className="card nu-card">
            <div className="topo">
              <h3>{c.nome}</h3>
              <span className="num" style={{ fontSize: 26 }} title="Satisfação Geral (0 a 10)">{fmtNota(n[SATISFACAO], 1)}</span>
            </div>
            <span className="small muted">{MODALIDADE_LABEL[c.modalidade] || c.modalidade}{coordena ? ' · você coordena' : ''} · Satisfação Geral de 0 a 10</span>
            {forte && <div className="nu-pt"><b>Ponto forte</b><span>{forte}: {fmtNota(n[forte])}</span></div>}
            {fraca && fraca !== forte && <div className="nu-pt"><b>Oportunidade</b><span>{fraca}: {fmtNota(n[fraca])}</span></div>}
            <div className="chips">
              <button className="btn sm" aria-expanded={aberto === c.id} onClick={() => setAberto(aberto === c.id ? null : c.id)}>{aberto === c.id ? 'Esconder comentários' : 'Ver comentários'}</button>
              <a className="btn sm" href={'#/curso/' + encodeURIComponent(c.id)}>Abrir o curso</a>
            </div>
          </div>
        )
      })}
      {aberto && (
        <Modal titulo={'Comentários · ' + rotuloCurso(base.cursos.find((c) => c.id === aberto))} onFechar={() => setAberto(null)}>
          <ListaComentarios cursos={[aberto]} base={base} porPagina={10} />
        </Modal>
      )}
    </div>
  )
}

function PlanosCoordenadores({ base, ids, perfil, onMudou }) {
  const [mostrar, setMostrar] = useState(POR_VEZ)
  const lista = useMemo(() => {
    const papel = Object.fromEntries(base.usuarios.map((u) => [u.id, u.role]))
    const set = new Set(ids)
    return base.planos
      .filter((p) => set.has(p.curso_id) && ['coordenador', 'professor_auxiliar'].includes(papel[p.usuario_id]))
      .sort(porStatus)
  }, [base.planos, base.usuarios, ids])
  return (
    <section className="card">
      <div className="card-h">
        <div className="t">
          <h2>Planos de ação dos coordenadores do núcleo</h2>
          <p className="muted small">
            Visão só de acompanhamento: a aprovação desses planos é feita pela CPA e pela Pró-Reitoria. Se algo precisar de atenção, registre nas "Ações da direção" abaixo.
          </p>
        </div>
      </div>
      {lista.length === 0 && <Vazio>Nenhum plano de ação registrado pelos coordenadores do núcleo ainda.</Vazio>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.slice(0, mostrar).map((p) => <ItemPlano key={p.id} p={p} perfil={perfil} base={base} onMudou={onMudou} />)}
      </div>
      {lista.length > mostrar && (
        <button className="btn sm" style={{ alignSelf: 'center' }} onClick={() => setMostrar(mostrar + POR_VEZ)}>
          Mostrar mais ({lista.length - mostrar} restantes)
        </button>
      )}
    </section>
  )
}

const VAZIA = { curso_id: '', titulo: '', descricao: '', prioridade: 'Média', prazo: '' }
const SELO_PRIO = { Alta: 'laranja', Média: 'cinza', Baixa: 'verde' }

function AcoesDirecao({ base, ids, perfil, diretor }) {
  const [acoes, setAcoes] = useState(null)
  const [erro, setErro] = useState(null)
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porUsuario = useMemo(() => Object.fromEntries(base.usuarios.map((u) => [u.id, u])), [base.usuarios])
  // Mesma regra do sistema anterior: as ações da direção são para os cursos do núcleo que a pessoa não coordena
  const naoCoordenados = ids.filter((id) => !perfil.cursos.includes(id)).map((id) => porCurso[id]).filter(Boolean).sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b)))

  function carregar() {
    return listarAcoesDirecao()
      .then((l) => setAcoes(l))
      .catch((e) => setErro(e))
  }
  useEffect(() => {
    let vivo = true
    listarAcoesDirecao()
      .then((l) => vivo && setAcoes(l))
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [])

  const doNucleo = (acoes || []).filter((a) => ids.includes(a.curso_id) || (diretor && a.usuario_id === perfil.id))

  return (
    <section className="card">
      <div className="card-h">
        <div className="t">
          <h2>Ações da direção</h2>
          <p className="muted small">{diretor ? 'Para os cursos do núcleo que você não coordena diretamente.' : 'Registradas pelas direções de núcleo (somente leitura).'}</p>
        </div>
      </div>
      {diretor && (
        naoCoordenados.length ? (
          <FormAcao cursos={naoCoordenados} onSalvo={carregar} />
        ) : (
          <div className="aviso">Você coordena diretamente todos os cursos do núcleo; use o plano de ação do curso.</div>
        )
      )}
      <Erro erro={erro} />
      {!acoes && !erro && <Carregando texto="Carregando as ações da direção…" />}
      {acoes && doNucleo.length === 0 && <Vazio>Nenhuma ação da direção registrada ainda.</Vazio>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {doNucleo.map((a) => {
          const dono = a.usuario_id === perfil.id
          return (
            <article key={a.id} className="plano-item">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <b style={{ flex: 1, minWidth: 200 }}>{a.titulo}</b>
                <span className="selo azul">Ação da direção</span>
              </div>
              <div className="chips" style={{ gap: 6 }}>
                <span className="selo cinza">{rotuloCurso(porCurso[a.curso_id]) || a.curso_id}</span>
                <span className={'selo ' + (SELO_PRIO[a.prioridade] || 'cinza')}>Prioridade {String(a.prioridade || '').toLowerCase()}</span>
                {!dono && porUsuario[a.usuario_id] && <span className="selo cinza">Registrada por: {porUsuario[a.usuario_id].nome}</span>}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{a.descricao}</p>
              <p className="small muted">Prazo de entrega: {fmtData(a.prazo) || '—'}{a.criado_em ? ` · registrada em ${fmtData(a.criado_em)}` : ''}</p>
              {dono && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn sm" onClick={() => setEditando(a)}>Editar</button>
                  <button className="btn sm" style={{ color: 'var(--ember-deep)' }} onClick={() => setExcluindo(a)}>Excluir</button>
                </div>
              )}
            </article>
          )
        })}
      </div>
      {editando && (
        <Modal titulo="Editar ação da direção" onFechar={() => setEditando(null)}>
          <FormAcao
            cursos={[...naoCoordenados, ...(naoCoordenados.some((c) => c.id === editando.curso_id) || !porCurso[editando.curso_id] ? [] : [porCurso[editando.curso_id]])]}
            inicial={editando}
            onSalvo={() => {
              setEditando(null)
              return carregar()
            }}
          />
        </Modal>
      )}
      {excluindo && <ModalExcluir acao={excluindo} onFechar={() => setExcluindo(null)} onOk={() => { setExcluindo(null); return carregar() }} />}
    </section>
  )
}

function FormAcao({ cursos, inicial, onSalvo }) {
  const [f, setF] = useState(inicial ? { curso_id: inicial.curso_id, titulo: inicial.titulo || '', descricao: inicial.descricao || '', prioridade: inicial.prioridade || 'Média', prazo: inicial.prazo || '' } : { ...VAZIA, curso_id: cursos[0]?.id || '' })
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pre = inicial ? 'ea' : 'na'

  async function salvar(e) {
    e.preventDefault()
    if (ocupado) return
    const inval = validarAcao(f)
    if (inval) return setMsg({ t: inval, c: 'erro' })
    setOcupado(true)
    setMsg(null)
    try {
      if (inicial) await editarAcaoDirecao(inicial.id, f)
      else {
        await criarAcaoDirecao(f)
        setF({ ...VAZIA, curso_id: f.curso_id })
        setMsg({ t: 'Ação da direção salva.', c: 'ok' })
      }
      await onSalvo?.()
    } catch (err) {
      setMsg({ t: err.message, c: 'erro' })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="campo">
        <label htmlFor={pre + '-curso'}>Curso</label>
        <select id={pre + '-curso'} value={f.curso_id} onChange={set('curso_id')}>
          {cursos.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor={pre + '-titulo'}>Título da ação</label>
        <input id={pre + '-titulo'} value={f.titulo} onChange={set('titulo')} placeholder="Ex.: Reforçar laboratório do curso" />
      </div>
      <div className="campo">
        <label htmlFor={pre + '-desc'}>Descrição</label>
        <textarea id={pre + '-desc'} className="input" rows={4} value={f.descricao} onChange={set('descricao')} placeholder="Descreva a ação planejada pela direção para este curso…" style={{ height: 'auto', padding: 12 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="campo">
          <label htmlFor={pre + '-prio'}>Prioridade</label>
          <select id={pre + '-prio'} value={f.prioridade} onChange={set('prioridade')}>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</select>
        </div>
        <div className="campo">
          <label htmlFor={pre + '-prazo'}>Prazo de entrega</label>
          <input id={pre + '-prazo'} type="date" value={f.prazo} onChange={set('prazo')} />
        </div>
      </div>
      {msg && <div className={'aviso ' + msg.c} role="status">{msg.t}</div>}
      <div>
        <button className="btn escuro" disabled={ocupado}>{ocupado ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Salvar ação da direção'}</button>
      </div>
    </form>
  )
}

function ModalExcluir({ acao, onFechar, onOk }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)
  async function excluir() {
    setOcupado(true)
    setErro(null)
    try {
      await excluirAcaoDirecao(acao.id)
      await onOk()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }
  return (
    <Modal titulo="Excluir esta ação da direção?" onFechar={onFechar}>
      <p>"{acao.titulo}" sai da lista. Essa ação não pode ser desfeita.</p>
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn escuro" disabled={ocupado} onClick={excluir}>Excluir</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}
