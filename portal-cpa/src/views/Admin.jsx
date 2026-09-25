import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROLE_LABELS } from '../lib/config.js'
import { rotuloCurso } from '../lib/escopo.js'
import { fmtInt } from '../lib/cpa.js'
import { Carregando, Vazio, Erro } from '../components/ui.jsx'
import {
  carregarSolicitacoes,
  aprovarSolicitacao,
  recusarSolicitacao,
  carregarUsuarios,
  editarUsuario,
  excluirUsuario,
  resetarSenha,
  NUCLEO_SETORES,
  NUCLEO_SETOR_LABELS,
} from '../lib/admin.js'
import './admin.css'

// Administração do Portal: só o Gestor Técnico (role "admin"), como no sistema anterior.
export default function Admin({ perfil, base, recarregarBase }) {
  const [aba, setAba] = useState('aprovacoes')
  const [aviso, setAviso] = useState(null)

  if (perfil.role !== 'admin') return <div className="aviso erro">Esta área é só do Gestor Técnico do sistema.</div>

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Administração</div>
          <h1>Acessos ao Portal.</h1>
        </div>
      </div>
      <div className="seg" role="tablist" aria-label="Administração">
        <button role="tab" aria-selected={aba === 'aprovacoes'} aria-pressed={aba === 'aprovacoes'} onClick={() => { setAba('aprovacoes'); setAviso(null) }}>Aprovações</button>
        <button role="tab" aria-selected={aba === 'usuarios'} aria-pressed={aba === 'usuarios'} onClick={() => { setAba('usuarios'); setAviso(null) }}>Usuários</button>
      </div>
      {aviso && <div className={'aviso ' + aviso.tipo} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.txt}</div>}
      {aba === 'aprovacoes' && <Aprovacoes base={base} setAviso={setAviso} recarregarBase={recarregarBase} />}
      {aba === 'usuarios' && <Usuarios base={base} perfil={perfil} setAviso={setAviso} recarregarBase={recarregarBase} />}
    </>
  )
}

// Botão que pede um segundo clique em até 4 segundos (mesmo padrão do sistema anterior)
function BotaoConfirmar({ rotulo, confirmar, ocupado, onConfirmar, perigo = true }) {
  const [armado, setArmado] = useState(false)
  useEffect(() => {
    if (!armado) return
    const t = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(t)
  }, [armado])
  return (
    <button
      type="button"
      className={'btn sm' + (perigo ? ' perigo' : '') + (armado ? ' confirmando' : '')}
      disabled={!!ocupado}
      onClick={() => {
        if (armado) {
          setArmado(false)
          onConfirmar()
        } else setArmado(true)
      }}
    >
      {typeof ocupado === 'string' ? ocupado : armado ? confirmar : rotulo}
    </button>
  )
}

// ---------------- Aprovações ----------------
function Aprovacoes({ base, setAviso, recarregarBase }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(null)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s])), [base.setores])

  const carregar = useCallback(() => {
    return carregarSolicitacoes()
      .then((d) => {
        setErro(null)
        setLista(d)
      })
      .catch((e) => {
      setErro(e)
      setLista([])
    })
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  if (!lista) return <Carregando texto="Carregando solicitações…" />
  const pendentes = lista.filter((s) => s.status === 'pendente')

  const aprovar = async (s) => {
    setOcupado(s.id)
    setAviso({ tipo: '', txt: 'Criando o acesso… só um instante.' })
    try {
      const r = await aprovarSolicitacao(s)
      if (r?.aviso) console.warn(r.aviso)
      setAviso({ tipo: 'ok', txt: 'Acesso criado com sucesso! ' + s.nome + ' já pode entrar com o e-mail e a senha que escolheu.' })
      recarregarBase?.()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível criar o acesso: ' + e.message + '. A solicitação continua pendente — corrija o que for necessário e tente aprovar de novo.' })
    }
    setOcupado(null)
    carregar()
  }
  const recusar = async (s) => {
    setOcupado(s.id)
    try {
      await recusarSolicitacao(s.id)
      setAviso({ tipo: 'ok', txt: 'Solicitação de ' + s.nome + ' recusada.' })
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível recusar agora: ' + (e.message || 'erro desconhecido') })
    }
    setOcupado(null)
    carregar()
  }

  const alvo = (s) => {
    if (s.perfil === 'setor')
      return <><strong>Setor:</strong> {porSetor[s.setor_infra]?.nome || s.setor_infra || '—'}</>
    if (s.perfil === 'diretor_nucleo_setor') {
      const setores = (NUCLEO_SETORES[s.nucleo_setor] || []).map((id) => porSetor[id]?.nome || id).join(', ')
      return <><strong>Núcleo de setores:</strong> {NUCLEO_SETOR_LABELS[s.nucleo_setor] || s.nucleo_setor || '—'}{setores && ` (${setores})`}</>
    }
    const cursos = (s.cursos || []).map((id) => (porCurso[id] ? rotuloCurso(porCurso[id]) : id)).join(', ')
    return <><strong>Cursos:</strong> {cursos || '—'}</>
  }

  return (
    <div className="card">
      <div className="card-h">
        <div className="t">
          <h3>Solicitações de acesso pendentes</h3>
          <span className="small muted">{fmtInt(pendentes.length)} {pendentes.length === 1 ? 'pendente' : 'pendentes'}</span>
        </div>
        <div className="spacer" />
        <button className="btn sm" onClick={carregar}>Atualizar</button>
      </div>
      <Erro erro={erro} />
      {!pendentes.length ? (
        <Vazio>Nenhuma solicitação pendente no momento.</Vazio>
      ) : (
        <div className="adm-lista">
          {pendentes.map((s) => (
            <div key={s.id} className="adm-item">
              <div className="topo">
                <b>{s.nome}</b>
                <span className="selo laranja">Pendente</span>
              </div>
              <div className="meta">
                <span>{s.email}</span>
                <span>{s.setor_cargo || '—'}</span>
                {s.criado_em && <span>pedido em {new Date(s.criado_em).toLocaleDateString('pt-BR')}</span>}
              </div>
              <p className="desc"><strong>Perfil solicitado:</strong> {ROLE_LABELS[s.perfil] || s.perfil}</p>
              <p className="desc">{alvo(s)}</p>
              <div className="adm-acoes">
                <button className="btn sm escuro" style={{ flex: 1 }} disabled={!!ocupado} onClick={() => aprovar(s)}>
                  {ocupado === s.id ? 'Aguarde…' : 'Aprovar'}
                </button>
                <button className="btn sm perigo" style={{ flex: 1 }} disabled={!!ocupado} onClick={() => recusar(s)}>Recusar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------- Usuários ----------------
function normalizar(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Usuarios({ base, perfil, setAviso, recarregarBase }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [role, setRole] = useState('')
  const [editando, setEditando] = useState(null)
  const [ocupado, setOcupado] = useState({})
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const porSetor = useMemo(() => Object.fromEntries(base.setores.map((s) => [s.id, s])), [base.setores])

  const carregar = useCallback(() => {
    return carregarUsuarios()
      .then((d) => {
        setErro(null)
        setLista(d)
      })
      .catch((e) => {
      setErro(e)
      setLista([])
    })
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  if (!lista) return <Carregando texto="Carregando usuários…" />

  const contagem = {}
  for (const u of lista) contagem[u.role] = (contagem[u.role] || 0) + 1
  const termo = normalizar(busca.trim())
  const filtrados = lista
    .filter((u) => (!role || u.role === role) && (!termo || normalizar(u.nome).includes(termo) || normalizar(u.email).includes(termo)))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))

  const marcar = (id, txt) => setOcupado((o) => ({ ...o, [id]: txt }))
  const desmarcar = (id) => setOcupado((o) => ({ ...o, [id]: null }))

  const resetar = async (u) => {
    marcar(u.id, 'Resetando…')
    try {
      await resetarSenha(u.id)
      setAviso({ tipo: 'ok', txt: 'Senha de ' + u.nome + ' resetada para a senha padrão. Ela vai precisar trocar no próximo acesso.' })
      carregar()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível resetar a senha: ' + e.message })
    }
    desmarcar(u.id)
  }
  const excluir = async (u) => {
    marcar(u.id, 'Excluindo…')
    try {
      await excluirUsuario(u.id)
      setAviso({ tipo: 'ok', txt: 'Acesso de ' + u.nome + ' excluído com sucesso.' })
      await carregar()
      recarregarBase?.()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível excluir o acesso: ' + e.message })
    }
    desmarcar(u.id)
  }
  const salvar = async (u, novoRole, cursos) => {
    marcar(u.id, 'Salvando…')
    try {
      await editarUsuario(u.id, novoRole, cursos)
      setAviso({ tipo: 'ok', txt: 'Acesso de ' + u.nome + ' atualizado com sucesso.' })
      setEditando(null)
      await carregar()
      recarregarBase?.()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível salvar as alterações: ' + e.message })
    }
    desmarcar(u.id)
  }

  const vinculo = (u) => {
    if (u.role === 'setor') return u.setor_id ? `Setor: ${porSetor[u.setor_id]?.nome || u.setor_id}` : null
    if (u.role === 'diretor_nucleo_setor') return u.nucleo_setor ? `Núcleo de setores: ${NUCLEO_SETOR_LABELS[u.nucleo_setor] || u.nucleo_setor}` : null
    if (!u.cursos.length) return null
    const nomes = u.cursos.map((id) => (porCurso[id] ? rotuloCurso(porCurso[id]) : id))
    return (u.cursos.length === 1 ? 'Curso: ' : `${u.cursos.length} cursos: `) + nomes.join(', ')
  }

  return (
    <div className="card">
      <div className="filtros adm-filtros">
        <label className="sr-only" htmlFor="adm-busca">Buscar usuário</label>
        <input id="adm-busca" type="search" className="input" placeholder="Buscar por nome ou e-mail…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
        <label className="sr-only" htmlFor="adm-role">Perfil</label>
        <select id="adm-role" className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ minWidth: 220 }}>
          <option value="">Todos os perfis ({fmtInt(lista.length)})</option>
          {Object.keys(ROLE_LABELS).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]} ({fmtInt(contagem[r] || 0)})</option>
          ))}
        </select>
        <span className="small muted">{fmtInt(filtrados.length)} {filtrados.length === 1 ? 'usuário' : 'usuários'}</span>
        {(busca || role) && <button className="btn sm" onClick={() => { setBusca(''); setRole('') }}>Limpar filtros</button>}
      </div>
      <Erro erro={erro} />
      {!filtrados.length ? (
        <Vazio>Nenhum usuário encontrado.</Vazio>
      ) : (
        <div className="adm-lista">
          {filtrados.map((u) => {
            const v = vinculo(u)
            const eu = u.id === perfil.id
            return (
              <div key={u.id} className="adm-item">
                <div className="topo">
                  <b>{u.nome}{eu && <span className="muted" style={{ fontWeight: 400 }}> (você)</span>}</b>
                  <span className="selo azul">{ROLE_LABELS[u.role] || u.role}</span>
                  {!u.primeiro_acesso_ok && <span className="selo cinza">primeiro acesso pendente</span>}
                </div>
                <div className="meta"><span>{u.email}</span></div>
                {v && <p className="desc small muted">{v}</p>}
                <div className="adm-acoes">
                  <BotaoConfirmar rotulo="Resetar senha para o padrão" confirmar="Clique de novo pra confirmar" ocupado={ocupado[u.id] === 'Resetando…' ? 'Resetando…' : ocupado[u.id] ? true : null} onConfirmar={() => resetar(u)} />
                  <button type="button" className="btn sm" aria-expanded={editando === u.id} onClick={() => setEditando(editando === u.id ? null : u.id)} disabled={!!ocupado[u.id]}>
                    {editando === u.id ? 'Fechar edição' : 'Editar'}
                  </button>
                  {!eu && (
                    <BotaoConfirmar rotulo="Excluir acesso" confirmar="Clique de novo pra confirmar a exclusão" ocupado={ocupado[u.id] === 'Excluindo…' ? 'Excluindo…' : ocupado[u.id] ? true : null} onConfirmar={() => excluir(u)} />
                  )}
                </div>
                {editando === u.id && <EditarUsuario u={u} cursos={base.cursos} salvando={ocupado[u.id] === 'Salvando…'} onSalvar={(r, c) => salvar(u, r, c)} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditarUsuario({ u, cursos, salvando, onSalvar }) {
  const [role, setRole] = useState(u.role)
  const [sel, setSel] = useState(u.cursos)
  const [filtro, setFiltro] = useState('')
  const termo = normalizar(filtro.trim())
  const ordenados = useMemo(() => [...cursos].sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b), 'pt-BR')), [cursos])
  const visiveis = ordenados.filter((c) => !termo || normalizar(rotuloCurso(c)).includes(termo) || sel.includes(c.id))
  const alternar = (id) => setSel((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const desconhecidos = sel.filter((id) => !cursos.some((c) => c.id === id))
  return (
    <div className="adm-edicao">
      <div className="campo">
        <label htmlFor={'ed-role-' + u.id}>Perfil de acesso</label>
        <select id={'ed-role-' + u.id} value={role} onChange={(e) => setRole(e.target.value)}>
          {Object.keys(ROLE_LABELS).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor={'ed-cursos-' + u.id}>Cursos vinculados (deixe sem marcar se não se aplica)</label>
        <input id={'ed-cursos-' + u.id} type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar cursos pelo nome" />
        <div className="adm-checks" role="group" aria-label="Cursos vinculados">
          {desconhecidos.map((id) => (
            <label key={id}>
              <input type="checkbox" checked onChange={() => alternar(id)} />
              <span>{id} (curso não encontrado)</span>
            </label>
          ))}
          {visiveis.map((c) => (
            <label key={c.id}>
              <input type="checkbox" checked={sel.includes(c.id)} onChange={() => alternar(c.id)} />
              <span>{rotuloCurso(c)}</span>
            </label>
          ))}
        </div>
        <span className="small muted">{sel.length} {sel.length === 1 ? 'curso marcado' : 'cursos marcados'}</span>
      </div>
      <div className="adm-acoes">
        <button type="button" className="btn sm escuro" disabled={salvando} onClick={() => onSalvar(role, sel)}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </div>
  )
}
