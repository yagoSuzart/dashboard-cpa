import { useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, STATUS_PLANO, TRILHO, LINKS, ROLE_LABELS } from '../lib/config.js'
import { rotuloCurso, contarTrilho } from '../lib/escopo.js'
import { fmtInt } from '../lib/cpa.js'
import { Vazio } from '../components/ui.jsx'

const SELO_STATUS = {
  rascunho: 'cinza',
  enviado: 'escuro',
  aguardando_coordenador: 'laranja',
  aguardando_pro_reitoria: 'laranja',
  aprovado: 'azul',
  devolvido: 'laranja',
  concluido: 'verde',
}

function fmtData(d) {
  if (!d) return null
  const x = new Date(d.length <= 10 ? d + 'T12:00:00' : d)
  return Number.isNaN(x.getTime()) ? null : x.toLocaleDateString('pt-BR')
}

function situacaoPrazo(p) {
  if (!p.prazo || ['concluido', 'aprovado'].includes(p.status)) return null
  const dias = Math.ceil((new Date(p.prazo + 'T23:59:59') - new Date()) / 86400000)
  if (dias < 0) return { t: `atrasado ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, c: 'laranja' }
  if (dias <= 7) return { t: `vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, c: 'laranja' }
  return null
}

export default function Planos({ base, planos, param, perfil }) {
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
    if (dim && p.categoria !== dim) return false
    if (curso && p.curso_id !== curso) return false
    if (busca && !`${p.titulo} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Planos de ação</div>
          <h1>{fmtInt(planos.length)} planos, do envio à conclusão.</h1>
        </div>
      </div>
      {LINKS.sistemaAtual && (
        <div className="aviso">
          Criar, editar e aprovar planos continua sendo feito no{' '}
          <a href={LINKS.sistemaAtual} target="_blank" rel="noreferrer">Portal do Coordenador atual</a> até essa etapa chegar aqui.
        </div>
      )}
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
        <ListaPlanos planos={lista} base={base} perfil={perfil} />
      </div>
    </>
  )
}

export function ListaPlanos({ planos, base, compacto }) {
  const [aberto, setAberto] = useState(null)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s])), [base.setores])
  const porUsuario = useMemo(() => Object.fromEntries(base.usuarios.map((u) => [u.id, u])), [base.usuarios])
  if (!planos.length) return <Vazio>Nenhum plano por aqui.</Vazio>
  const alvo = (p) => (p.tipo === 'setor' ? porSetor[p.setor_id]?.nome || p.setor_id : rotuloCurso(porCurso[p.curso_id]))
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {planos.map((p) => {
          const prazo = situacaoPrazo(p)
          return (
            <button key={p.id} className="plano-item" onClick={() => setAberto(p)}>
              <b>{p.titulo}</b>
              <div className="chips" style={{ gap: 6 }}>
                <span className={'selo ' + SELO_STATUS[p.status]}>{STATUS_PLANO[p.status] || p.status}</span>
                {p.categoria && <span className="selo cinza">{p.categoria}</span>}
                {p.prioridade && !compacto && <span className="selo cinza">Prioridade {p.prioridade.toLowerCase()}</span>}
                {prazo && <span className={'selo ' + prazo.c}>{prazo.t}</span>}
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
      {aberto && <DetalhePlano p={aberto} alvo={alvo(aberto)} autor={porUsuario[aberto.usuario_id]} onFechar={() => setAberto(null)} />}
    </>
  )
}

function DetalhePlano({ p, alvo, autor, onFechar }) {
  const st = p.status === 'rascunho' ? 'enviado' : p.status
  const idx = TRILHO.indexOf(st)
  const passos = [
    { s: 'enviado', t: 'Enviado', info: fmtData(p.criado_em) && `em ${fmtData(p.criado_em)}` },
    { s: 'aguardando_coordenador', t: 'Revisão do coordenador', info: p.enviado_coordenador_em ? `enviado em ${fmtData(p.enviado_coordenador_em)}` : 'quando o plano é de alguém da equipe' },
    { s: 'aguardando_pro_reitoria', t: 'Pró-Reitoria', info: p.validado_por ? `validado por ${p.validado_por}` : null },
    { s: 'aprovado', t: 'Aprovado', info: p.revisado_por ? `por ${p.revisado_por}${p.revisado_em ? ' em ' + fmtData(p.revisado_em) : ''}` : null },
    { s: 'concluido', t: 'Concluído', info: p.data_conclusao ? `em ${fmtData(p.data_conclusao)}` : null },
  ]
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="plano-titulo" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="small muted">{alvo}</span>
            <h2 id="plano-titulo" style={{ fontSize: 30, lineHeight: 1.15 }}>{p.titulo}</h2>
          </div>
          <button className="btn sm" onClick={onFechar}>Fechar</button>
        </div>
        <div className="chips" style={{ gap: 6 }}>
          <span className={'selo ' + SELO_STATUS[p.status]}>{STATUS_PLANO[p.status] || p.status}</span>
          {p.categoria && <span className="selo cinza">{p.categoria}</span>}
          {p.prioridade && <span className="selo cinza">Prioridade {p.prioridade.toLowerCase()}</span>}
          {p.prazo && <span className="selo cinza">Prazo {fmtData(p.prazo)}</span>}
          {p.externa && <span className="selo laranja">Depende de outro setor{p.area ? `: ${p.area}` : ''}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 250px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Bloco t="O que vamos fazer">{p.descricao}</Bloco>
            {p.indicador && <Bloco t="Como vamos medir">{p.indicador}</Bloco>}
            <Bloco t="Quem escreveu">{autor ? `${autor.nome} · ${ROLE_LABELS[autor.role] || autor.role}` : '—'}</Bloco>
            {p.comentarios_selecionados?.length > 0 && <Bloco t="Comentários anexados">{p.comentarios_selecionados.length} comentário(s) de alunos anexados ao plano.</Bloco>}
            {p.comentario_revisor && <Bloco t="Comentário de quem revisou">{p.comentario_revisor}</Bloco>}
          </div>
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

function Bloco({ t, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="small" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t}</span>
      <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{children}</p>
    </div>
  )
}
