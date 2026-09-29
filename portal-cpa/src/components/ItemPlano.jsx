import { useState } from 'react'
import { rotuloCurso } from '../lib/escopo.js'
import {
  PRIORIDADES, SELO_STATUS, areasDisponiveis, TEXTO_STATUS, acoes, botoesDoPlano, coordenaAutor, coordenadoresDoCurso, devolvidoAoCoordenador, excluirPlano, fmtData, hoje,
  nomeArea, partesPrazoPlano, rotuloStatus, seloPrazo, textoPrazoSetor, useVinculos,
} from '../lib/planos.js'

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
  editarComentario: 'Editar comentário da devolução',
  editarConsideracoes: 'Editar considerações da CPA',
}
// Quem devolve e, se o autor for professor auxiliar, o plano volta para o coordenador do curso
const REVISORES = ['diretor_cpa', 'pro_reitoria', 'admin']
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
  const pz = partesPrazoPlano(p, autor)
  const autorAuxiliar = autor?.role === 'professor_auxiliar'
  const paraCoordenador = autorAuxiliar && REVISORES.includes(perfil.role) && !!p.curso_id
  const voltouAoCoordenador = devolvidoAoCoordenador(p)
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
    if (['devolver', 'editar', 'jaResolvi', 'excluir', 'validarCPA', 'editarComentario', 'editarConsideracoes'].includes(b)) return setModal(b)
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
        {p.externa ? <span className="selo laranja">Depende do setor: {nomeArea(p.area, base.setores)}</span> : <span className="selo verde">Sob gestão direta</span>}
      </div>
      <div className="chips" style={{ gap: 6 }}>
        <span className="selo cinza">{alvo}</span>
        {p.categoria && <span className="selo cinza">{p.categoria}</span>}
        {p.prioridade && <span className="selo cinza">Prioridade {p.prioridade.toLowerCase()}</span>}
        <span className={'selo ' + SELO_STATUS[p.status]} title={TEXTO_STATUS[p.status]}>{rotuloStatus(p)}</span>
        {prazo && <span className={'selo ' + prazo.c}>{prazo.t}</span>}
        {p.externa && p.atendido_pelo_setor && <span className="selo verde">Atendido pelo setor</span>}
        {autor && autor.id !== perfil.id && <span className="selo cinza">Criado por: {autor.nome}</span>}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{p.descricao}</p>
      {p.indicador && <p className="small"><b>Indicador de sucesso:</b> {p.indicador}</p>}
      <div className="plano-prazos small">
        <span><b>{pz.rotulo}:</b> {pz.valor}</span>
        {p.externa && <span className="muted">{textoPrazoSetor(p, base.setores)}</span>}
      </div>
      {p.status === 'concluido' && <p className="small" style={{ color: 'var(--green-ink)' }}>Concluído{p.data_conclusao ? ` em ${fmtData(p.data_conclusao)}` : ''}{p.revisado_por ? ` · ${p.revisado_por}` : ''}</p>}
      {p.status === 'aprovado' && <p className="small" style={{ color: 'var(--green-ink)' }}>Aprovado por {p.revisado_por || '—'}</p>}
      {p.status === 'aguardando_pro_reitoria' && <p className="small" style={{ color: 'var(--ember-ink)' }}>Validado pela CPA ({p.validado_por || '—'}) · aguardando a aprovação final da Pró-Reitoria</p>}
      {p.consideracoes_cpa && (
        <div className="aviso plano-consideracoes" style={{ flexDirection: 'column', gap: 2 }}>
          <b className="small">Considerações da CPA{p.validado_por ? ` · ${p.validado_por}` : ''}</b>
          <span className="small" style={{ whiteSpace: 'pre-line' }}>{p.consideracoes_cpa}</span>
        </div>
      )}
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
      {(p.status === 'devolvido' || voltouAoCoordenador) && p.comentario_revisor && (
        <div className="aviso erro" style={{ flexDirection: 'column', gap: 2 }}>
          <b className="small">
            {voltouAoCoordenador ? 'Devolvido pela CPA/Pró-Reitoria ao coordenador do curso' : 'Devolvido para ajuste'}
            {' · '}comentário de {p.revisado_por || 'quem revisou'}{p.revisado_em ? ` em ${fmtData(p.revisado_em)}` : ''}
          </b>
          <span className="small" style={{ whiteSpace: 'pre-line' }}>{p.comentario_revisor}</span>
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
      {modal === 'devolver' && (
        <ModalDevolver p={p} base={base} paraCoordenador={paraCoordenador} onFechar={() => setModal(null)} ocupado={ocupado} erro={erro}
          onOk={(t) => rodar(() => acoes.devolver(p.id, perfil, t, { paraCoordenador }), paraCoordenador ? 'Plano devolvido ao coordenador do curso com o seu comentário.' : 'Plano devolvido com o seu comentário.')} />
      )}
      {modal === 'validarCPA' && (
        <ModalTexto titulo="Validar e encaminhar à Pró-Reitoria" rotulo="Considerações da CPA (opcional)" id="cpa-cons" opcional
          ajuda="A Pró-Reitoria lê estas considerações antes de aprovar; depois elas ficam visíveis para todos no plano. Você pode editá-las enquanto o plano estiver com a Pró-Reitoria."
          botao="Validar e encaminhar" onFechar={() => setModal(null)} ocupado={ocupado} erro={erro}
          onOk={(t) => rodar(() => acoes.validarCPA(p.id, perfil, t), 'Plano validado e encaminhado à Pró-Reitoria.')} />
      )}
      {modal === 'editarConsideracoes' && (
        <ModalTexto titulo="Editar considerações da CPA" rotulo="Considerações da CPA (deixe vazio para remover)" id="cpa-cons" opcional inicial={p.consideracoes_cpa || ''}
          botao="Salvar considerações" onFechar={() => setModal(null)} ocupado={ocupado} erro={erro}
          onOk={(t) => rodar(() => acoes.editarConsideracoes(p.id, t), 'Considerações da CPA atualizadas.')} />
      )}
      {modal === 'editarComentario' && (
        <ModalTexto titulo="Editar comentário da devolução" rotulo="Comentário da devolução" id="dev-ed" inicial={p.comentario_revisor || ''}
          botao="Salvar comentário" onFechar={() => setModal(null)} ocupado={ocupado} erro={erro}
          onOk={(t) => rodar(() => acoes.editarComentario(p.id, t), 'Comentário da devolução atualizado.')} />
      )}
      {modal === 'editar' && <ModalEditar p={p} base={base} onFechar={() => setModal(null)} ocupado={ocupado} erro={erro} onOk={(c) => rodar(() => acoes.editar(p.id, c), 'Alterações salvas.')} />}
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

function ModalDevolver({ p, base, paraCoordenador, onFechar, onOk, ocupado, erro }) {
  const [t, setT] = useState('')
  return (
    <Modal titulo="Devolver para ajuste" onFechar={onFechar}>
      {paraCoordenador && <AvisoAuxiliar p={p} base={base} />}
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

// Aviso de que o plano do professor auxiliar volta para o coordenador do curso (não para o auxiliar)
function AvisoAuxiliar({ p, base }) {
  const { lista } = useVinculos()
  const nomes = coordenadoresDoCurso(p.curso_id, lista, base).map((u) => u.nome)
  const quem = lista == null ? '…' : nomes.length ? nomes.join(' / ') : 'do curso'
  return (
    <div className="aviso" role="note">
      <span className="small">
        <b>Este plano é de um professor auxiliar:</b> ele volta para o coordenador {quem}, que ajusta e envia de novo para validação.
      </span>
    </div>
  )
}

// Janela com um texto (considerações da CPA, correção do comentário da devolução)
function ModalTexto({ titulo, rotulo, id, ajuda, botao, inicial = '', opcional = false, onFechar, onOk, ocupado, erro }) {
  const [t, setT] = useState(inicial)
  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      {ajuda && <p className="small muted">{ajuda}</p>}
      <div className="campo">
        <label htmlFor={id}>{rotulo}</label>
        <textarea id={id} className="input" rows={5} autoFocus value={t} onChange={(e) => setT(e.target.value)} style={{ height: 'auto', padding: 12 }} />
      </div>
      {erro && <div className="aviso erro">{erro}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn escuro" disabled={ocupado || (!opcional && !t.trim())} onClick={() => onOk(t)}>{botao}</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}

function ModalEditar({ p, base, onFechar, onOk, ocupado, erro }) {
  const areas = areasDisponiveis(base.setores)
  const [c, setC] = useState({
    titulo: p.titulo || '',
    descricao: p.descricao || '',
    indicador: p.indicador || '',
    prioridade: p.prioridade || 'Média',
    prazo: p.prazo || '',
    externa: !!p.externa,
    area: p.area && areas.some((a) => a.v === p.area) ? p.area : p.area || areas[0]?.v,
    queixa_aluno: p.queixa_aluno || '',
    prazo_estimado: p.prazo_estimado || '',
  })
  const [aviso, setAviso] = useState(null)
  const set = (k) => (e) => setC({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  // Um setor antigo que já não está na lista continua aparecendo como opção
  const opcoes = c.area && !areas.some((a) => a.v === c.area) ? [{ v: c.area, t: nomeArea(c.area, base.setores) }, ...areas] : areas
  function salvar() {
    if (!c.titulo.trim() || !c.descricao.trim() || !c.prazo) return setAviso('Preencha ao menos o título, a descrição e o prazo do plano antes de salvar.')
    if (c.externa && !c.queixa_aluno.trim()) return setAviso('Descreva a queixa do aluno relacionada a este problema, para ajudar o setor responsável a entender a demanda.')
    onOk(c)
  }
  return (
    <Modal titulo="Editar item do plano" onFechar={onFechar}>
      <div className="campo"><label htmlFor="ed-t">Título</label><input id="ed-t" value={c.titulo} onChange={set('titulo')} /></div>
      <div className="campo"><label htmlFor="ed-d">Descrição</label><textarea id="ed-d" className="input" rows={5} value={c.descricao} onChange={set('descricao')} style={{ height: 'auto', padding: 12 }} /></div>
      <div className="campo"><label htmlFor="ed-i">Indicador de sucesso</label><input id="ed-i" value={c.indicador} onChange={set('indicador')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="campo"><label htmlFor="ed-p">Prioridade</label><select id="ed-p" value={c.prioridade} onChange={set('prioridade')}>{PRIORIDADES.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="campo"><label htmlFor="ed-z">Prazo do plano</label><input id="ed-z" type="date" value={c.prazo} onChange={set('prazo')} /></div>
      </div>
      {p.tipo !== 'setor' && (
        <>
          <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
            <input id="ed-ext" type="checkbox" checked={c.externa} onChange={set('externa')} />
            Esta ação depende de outro setor (não está sob gestão direta)
          </label>
          {c.externa && (
            <div className="card" style={{ background: 'var(--paper-2)', gap: 12, padding: 16 }}>
              <div className="campo">
                <label htmlFor="ed-area">Setor responsável</label>
                <select id="ed-area" value={c.area || ''} onChange={set('area')}>
                  {opcoes.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="ed-q">Queixa do aluno relacionada</label>
                <textarea id="ed-q" className="input" rows={3} value={c.queixa_aluno} onChange={set('queixa_aluno')} style={{ height: 'auto', padding: 12 }} />
              </div>
              <div className="campo">
                <label htmlFor="ed-pe">Prazo estimado pelo setor (não vinculante)</label>
                <input id="ed-pe" type="date" value={c.prazo_estimado} onChange={set('prazo_estimado')} />
              </div>
            </div>
          )}
        </>
      )}
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

