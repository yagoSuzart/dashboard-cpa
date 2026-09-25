import { useState } from 'react'
import { STATUS_PLANO } from '../lib/config.js'
import { rotuloCurso } from '../lib/escopo.js'
import { PRIORIDADES, SELO_STATUS, TEXTO_STATUS, acoes, botoesDoPlano, coordenaAutor, excluirPlano, fmtData, hoje, nomeArea, seloPrazo } from '../lib/planos.js'

const ROTULO = {
  validarCPA: 'Validar e encaminhar à Pró-Reitoria',
  aprovar: 'Aprovar',
  devolver: 'Devolver para ajuste',
  reenviar: 'Já ajustei, reenviar',
  concluir: 'Marcar como concluído',
  jaResolvi: 'Já resolvi',
  editar: 'Editar',
  excluir: 'Excluir',
  enviarParaValidacao: 'Aprovar e enviar para validação',
  puxarParaRevisao: 'Puxar de volta para revisão',
  atendidoPeloSetor: 'Marcar como atendido pelo setor',
}
const PRINCIPAIS = ['validarCPA', 'aprovar', 'reenviar', 'concluir', 'jaResolvi', 'enviarParaValidacao']

// Um plano com todos os detalhes e os botões que a pessoa pode usar nele
export default function ItemPlano({ p, perfil, base, onMudou, contexto }) {
  const [modal, setModal] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)
  const autor = base.usuarios.find((u) => u.id === p.usuario_id)
  const curso = base.cursos.find((c) => c.id === p.curso_id)
  const setor = base.setores.find((s) => s.id === p.setor_id)
  const alvo = p.tipo === 'setor' ? setor?.nome || p.setor_id : rotuloCurso(curso)
  const botoes = perfil.role === 'comissao_cpa' ? [] : botoesDoPlano(p, perfil, { coordenaAutor: coordenaAutor(perfil, p, base) })
  const prazo = seloPrazo(p)
  const borda = p.prioridade === 'Alta' ? 'var(--ember)' : p.prioridade === 'Média' ? '#e0b44a' : 'var(--green)'

  async function rodar(fn, sucesso) {
    if (ocupado) return
    setOcupado(true)
    setErro(null)
    try {
      await fn()
      setModal(null)
      onMudou?.(sucesso)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  function clicar(b) {
    if (['devolver', 'editar', 'jaResolvi', 'excluir'].includes(b)) return setModal(b)
    if (b === 'validarCPA') return rodar(() => acoes.validarCPA(p.id, perfil), 'Plano validado e encaminhado à Pró-Reitoria.')
    if (b === 'aprovar') return rodar(() => acoes.aprovar(p.id, perfil), 'Plano aprovado.')
    if (b === 'reenviar') return rodar(() => acoes.reenviar(p.id), 'Plano reenviado para análise.')
    if (b === 'concluir') return rodar(() => acoes.concluir(p.id), 'Plano marcado como concluído.')
    if (b === 'enviarParaValidacao') return rodar(() => acoes.enviarParaValidacao(p.id), `Plano de ${autor?.nome || 'auxiliar'} aprovado e enviado para validação.`)
    if (b === 'puxarParaRevisao') return rodar(() => acoes.puxarParaRevisao(p.id), 'Plano puxado de volta para revisão.')
    if (b === 'atendidoPeloSetor') return rodar(() => acoes.atendidoPeloSetor(p.id, !p.atendido_pelo_setor), 'Demanda atualizada.')
  }

  return (
    <article className="plano-item" style={{ borderLeft: `4px solid ${borda}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <b style={{ flex: 1, minWidth: 200 }}>{p.titulo}</b>
        {p.externa ? <span className="selo laranja">Depende de: {nomeArea(p.area, base.setores)}</span> : <span className="selo verde">Sob gestão direta</span>}
      </div>
      <div className="chips" style={{ gap: 6 }}>
        <span className="selo cinza">{alvo}</span>
        {p.categoria && <span className="selo cinza">{p.categoria}</span>}
        {p.prioridade && <span className="selo cinza">Prioridade {p.prioridade.toLowerCase()}</span>}
        <span className={'selo ' + SELO_STATUS[p.status]} title={TEXTO_STATUS[p.status]}>{STATUS_PLANO[p.status === 'rascunho' ? 'enviado' : p.status] || p.status}</span>
        {prazo && <span className={'selo ' + prazo.c}>{prazo.t}</span>}
        {p.externa && p.atendido_pelo_setor && <span className="selo verde">Atendido pelo setor</span>}
        {autor && autor.id !== perfil.id && <span className="selo cinza">Criado por: {autor.nome}</span>}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{p.descricao}</p>
      {p.indicador && <p className="small"><b>Indicador de sucesso:</b> {p.indicador}</p>}
      <p className="small muted">
        {p.externa
          ? `Prazo do coordenador: ${fmtData(p.prazo) || '—'} · Estimativa da área (não vinculante): ${fmtData(p.prazo_estimado) || '—'}`
          : `Prazo de entrega: ${fmtData(p.prazo) || '—'}`}
      </p>
      {p.status === 'concluido' && <p className="small" style={{ color: 'var(--green-ink)' }}>Concluído{p.data_conclusao ? ` em ${fmtData(p.data_conclusao)}` : ''}{p.revisado_por ? ` · ${p.revisado_por}` : ''}</p>}
      {p.status === 'aprovado' && <p className="small" style={{ color: 'var(--green-ink)' }}>Aprovado por {p.revisado_por || '—'}</p>}
      {p.status === 'aguardando_pro_reitoria' && <p className="small" style={{ color: 'var(--ember-ink)' }}>Validado pela CPA ({p.validado_por || '—'}) · aguardando a aprovação final da Pró-Reitoria</p>}
      {contexto}
      {p.comentarios_selecionados?.length > 0 && (
        <details className="small">
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Comentários que embasaram este plano ({p.comentarios_selecionados.length})</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {p.comentarios_selecionados.map((t, i) => <span key={i} style={{ fontStyle: 'italic' }}>"{t}"</span>)}
          </div>
        </details>
      )}
      {p.externa && p.queixa_aluno && (
        <div className="aviso" style={{ flexDirection: 'column', gap: 2 }}>
          <b className="small">Queixa do aluno relatada</b>
          <span className="small">{p.queixa_aluno}</span>
        </div>
      )}
      {p.status === 'devolvido' && p.comentario_revisor && (
        <div className="aviso erro" style={{ flexDirection: 'column', gap: 2 }}>
          <b className="small">Comentário de {p.revisado_por || 'quem revisou'}</b>
          <span className="small">{p.comentario_revisor}</span>
        </div>
      )}
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      {botoes.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {botoes.map((b) => (
            <button key={b} type="button" disabled={ocupado} className={'btn sm' + (PRINCIPAIS.includes(b) ? ' escuro' : '')} style={b === 'excluir' || b === 'devolver' ? { color: 'var(--ember-deep)' } : undefined} onClick={() => clicar(b)}>
              {b === 'atendidoPeloSetor' && p.atendido_pelo_setor ? 'Desmarcar atendido' : ROTULO[b]}
            </button>
          ))}
        </div>
      )}
      {modal === 'devolver' && <ModalDevolver onFechar={() => setModal(null)} ocupado={ocupado} erro={erro} onOk={(t) => rodar(() => acoes.devolver(p.id, perfil, t), 'Plano devolvido com o seu comentário.')} />}
      {modal === 'editar' && <ModalEditar p={p} onFechar={() => setModal(null)} ocupado={ocupado} erro={erro} onOk={(c) => rodar(() => acoes.editar(p.id, c), 'Alterações salvas.')} />}
      {modal === 'jaResolvi' && <ModalResolvido onFechar={() => setModal(null)} ocupado={ocupado} erro={erro} onOk={(d) => rodar(() => acoes.jaResolvi(p.id, perfil, d), 'Marcado como resolvido.')} />}
      {modal === 'excluir' && (
        <Modal titulo="Excluir este item?" onFechar={() => setModal(null)}>
          <p>
            {['aprovado', 'aguardando_pro_reitoria'].includes(p.status)
              ? 'Atenção: este item já foi aprovado ou está em análise avançada, e a Pró-Reitoria ou a CPA já podem ter visto. Excluir agora remove de vez, inclusive de quem está analisando.'
              : 'O item sai do plano de ação. Essa ação não pode ser desfeita.'}
          </p>
          {erro && <div className="aviso erro">{erro}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn escuro" disabled={ocupado} onClick={() => rodar(() => excluirPlano(p.id), 'Item excluído.')}>Excluir</button>
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </article>
  )
}

export function Modal({ titulo, onFechar, children }) {
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <h2 style={{ flex: 1, fontSize: 26 }}>{titulo}</h2>
          <button className="btn sm" onClick={onFechar}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalDevolver({ onFechar, onOk, ocupado, erro }) {
  const [t, setT] = useState('')
  return (
    <Modal titulo="Devolver para ajuste" onFechar={onFechar}>
      <div className="campo">
        <label htmlFor="dev-t">Explique o motivo da devolução</label>
        <textarea id="dev-t" className="input" rows={4} autoFocus value={t} onChange={(e) => setT(e.target.value)} style={{ height: 'auto', padding: 12 }} />
      </div>
      {erro && <div className="aviso erro">{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn escuro" disabled={ocupado || !t.trim()} onClick={() => onOk(t)}>Devolver</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}

function ModalEditar({ p, onFechar, onOk, ocupado, erro }) {
  const [c, setC] = useState({ titulo: p.titulo || '', descricao: p.descricao || '', indicador: p.indicador || '', prioridade: p.prioridade || 'Média', prazo: p.prazo || '' })
  const [aviso, setAviso] = useState(null)
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value })
  function salvar() {
    if (!c.titulo.trim() || !c.descricao.trim() || !c.prazo) return setAviso('Preencha ao menos o título, a descrição e o prazo antes de salvar.')
    onOk(c)
  }
  return (
    <Modal titulo="Editar item do plano" onFechar={onFechar}>
      <div className="campo"><label htmlFor="ed-t">Título</label><input id="ed-t" value={c.titulo} onChange={set('titulo')} /></div>
      <div className="campo"><label htmlFor="ed-d">Descrição</label><textarea id="ed-d" className="input" rows={5} value={c.descricao} onChange={set('descricao')} style={{ height: 'auto', padding: 12 }} /></div>
      <div className="campo"><label htmlFor="ed-i">Indicador de sucesso</label><input id="ed-i" value={c.indicador} onChange={set('indicador')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="campo"><label htmlFor="ed-p">Prioridade</label><select id="ed-p" value={c.prioridade} onChange={set('prioridade')}>{PRIORIDADES.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="campo"><label htmlFor="ed-z">Prazo</label><input id="ed-z" type="date" value={c.prazo} onChange={set('prazo')} /></div>
      </div>
      {(aviso || erro) && <div className="aviso erro">{aviso || erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn escuro" disabled={ocupado} onClick={salvar}>Salvar alterações</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}

function ModalResolvido({ onFechar, onOk, ocupado, erro }) {
  const [d, setD] = useState(hoje())
  return (
    <Modal titulo="Já resolvi" onFechar={onFechar}>
      <p>O item vai para "Concluído", registrado como autoaprovação.</p>
      <div className="campo"><label htmlFor="rs-d">Data em que foi resolvido</label><input id="rs-d" type="date" value={d} onChange={(e) => setD(e.target.value)} /></div>
      {erro && <div className="aviso erro">{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn escuro" disabled={ocupado || !d} onClick={() => onOk(d)}>Confirmar</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}

