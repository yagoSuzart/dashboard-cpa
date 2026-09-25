import { useEffect, useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { catalogoPublico, enviarSolicitacao, PERFIS_SOLICITAVEIS, PERFIS_COM_CURSOS, NUCLEO_SETORES, NUCLEO_SETOR_LABELS } from '../lib/admin.js'
import './admin.css'

// Tela pública (antes do login) para pedir acesso ao Portal. A solicitação fica pendente
// até o Gestor Técnico aprovar em Administração > Aprovações.
export default function SolicitarAcesso({ onVoltar }) {
  const [f, setF] = useState({ nome: '', email: '', senha: '', setorCargo: '', perfil: '', setorInfra: '', nucleoSetor: '' })
  const [cursos, setCursos] = useState([])
  const [catalogo, setCatalogo] = useState({ cursos: [], setores: [] })
  const [filtroCurso, setFiltroCurso] = useState('')
  const [ver, setVer] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    let vivo = true
    catalogoPublico().then((c) => vivo && setCatalogo(c)).catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const precisaCursos = PERFIS_COM_CURSOS.includes(f.perfil)
  const nomeSetor = useMemo(() => Object.fromEntries(catalogo.setores.map((s) => [s.id, s.nome])), [catalogo.setores])
  const cursosVisiveis = catalogo.cursos.filter((c) => !filtroCurso || c.nome.toLowerCase().includes(filtroCurso.toLowerCase()))
  const alternarCurso = (id) => setCursos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))

  const enviar = async (e) => {
    e.preventDefault()
    setMsg(null)
    const nome = f.nome.trim()
    const email = f.email.trim()
    if (!nome || !email || !f.senha || !f.perfil) return setMsg({ tipo: 'erro', txt: 'Preencha nome, e-mail, senha e o perfil de acesso solicitado.' })
    if (f.senha.length < 8) return setMsg({ tipo: 'erro', txt: 'A senha precisa ter no mínimo 8 caracteres.' })
    if (f.perfil === 'setor' && !f.setorInfra) return setMsg({ tipo: 'erro', txt: 'Selecione qual setor você representa.' })
    if (f.perfil === 'diretor_nucleo_setor' && !f.nucleoSetor) return setMsg({ tipo: 'erro', txt: 'Selecione qual núcleo de setores você supervisiona.' })
    setOcupado(true)
    try {
      await enviarSolicitacao({ nome, email, senha: f.senha, setorCargo: f.setorCargo.trim(), perfil: f.perfil, cursos, setorInfra: f.setorInfra, nucleoSetor: f.nucleoSetor })
      setEnviado(true)
    } catch (err) {
      setMsg({ tipo: 'erro', txt: 'Não foi possível enviar sua solicitação agora: ' + (err.message || 'erro desconhecido') + '. Tente de novo em alguns segundos.' })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="login">
      <div className="foto">
        <img className="bg" src="/campus.jpg" alt="" />
        <div className="dentro">
          <img src="/logo-unifecaf-branco.png" alt="UniFECAF" style={{ width: 168 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="eyebrow" style={{ color: '#9FE0B8' }}>Comissão Própria de Avaliação</div>
            <h1>Peça o seu acesso ao Portal CPA.</h1>
            <p style={{ color: '#d5dce6', maxWidth: 520, lineHeight: 1.55 }}>
              Depois do envio, o Gestor Técnico do sistema confere os dados e libera o acesso. Você entra com o e-mail e a senha escolhidos aqui.
            </p>
          </div>
        </div>
      </div>
      <div className="form">
        {enviado ? (
          <div className="adm-form" style={{ gap: 18 }}>
            <div className="eyebrow">Solicitação enviada</div>
            <h2 style={{ fontSize: 32, lineHeight: 1.15 }}>Pronto, recebemos o seu pedido.</h2>
            <div className="aviso ok" role="status">Solicitação enviada! Assim que o gestor técnico aprovar, você poderá entrar com este e-mail e senha.</div>
            <button type="button" className="btn escuro" onClick={onVoltar}>Voltar para o login</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="adm-form" noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="eyebrow">Portal CPA</div>
              <h2 style={{ fontSize: 34, lineHeight: 1.1 }}>Solicitar acesso</h2>
              <p className="muted" style={{ fontSize: 14 }}>Após o envio, aguarde a aprovação do administrador.</p>
            </div>
            <div className="campo">
              <label htmlFor="rq-nome">Nome completo</label>
              <input id="rq-nome" autoComplete="name" value={f.nome} onChange={set('nome')} placeholder="Seu nome completo" />
            </div>
            <div className="campo">
              <label htmlFor="rq-email">E-mail institucional</label>
              <input id="rq-email" type="email" autoComplete="email" value={f.email} onChange={set('email')} placeholder="o e-mail que você usa na UniFECAF" />
            </div>
            <div className="campo">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="rq-senha">Senha</label>
                <button type="button" className="adm-link" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Mostrar'}</button>
              </div>
              <input id="rq-senha" type={ver ? 'text' : 'password'} autoComplete="new-password" value={f.senha} onChange={set('senha')} placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="campo">
              <label htmlFor="rq-setor">Setor / Cargo</label>
              <input id="rq-setor" value={f.setorCargo} onChange={set('setorCargo')} placeholder="Ex.: Coordenação de Odontologia, CPA…" />
            </div>
            <div className="campo">
              <label htmlFor="rq-perfil">Perfil de acesso solicitado</label>
              <select id="rq-perfil" value={f.perfil} onChange={set('perfil')}>
                <option value="">Selecione…</option>
                {PERFIS_SOLICITAVEIS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            {precisaCursos && (
              <div className="campo">
                <label htmlFor="rq-cursos-busca">Quais cursos você coordena / acompanha?</label>
                <input id="rq-cursos-busca" type="search" value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)} placeholder="Filtrar cursos pelo nome" />
                <div className="adm-checks" role="group" aria-label="Cursos">
                  {cursosVisiveis.map((c) => (
                    <label key={c.id}>
                      <input type="checkbox" checked={cursos.includes(c.id)} onChange={() => alternarCurso(c.id)} />
                      <span>{c.nome} ({MODALIDADE_LABEL[c.modalidade] || c.modalidade})</span>
                    </label>
                  ))}
                  {!cursosVisiveis.length && <span className="small muted">Nenhum curso com esse nome.</span>}
                </div>
                {cursos.length > 0 && <span className="small muted">{cursos.length} {cursos.length === 1 ? 'curso selecionado' : 'cursos selecionados'}</span>}
              </div>
            )}
            {f.perfil === 'setor' && (
              <div className="campo">
                <label htmlFor="rq-setor-select">Qual setor você representa?</label>
                <select id="rq-setor-select" value={f.setorInfra} onChange={set('setorInfra')}>
                  <option value="">Selecione…</option>
                  {catalogo.setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            )}
            {f.perfil === 'diretor_nucleo_setor' && (
              <div className="campo">
                <label htmlFor="rq-nucleosetor-select">Qual núcleo de setores você supervisiona?</label>
                <select id="rq-nucleosetor-select" value={f.nucleoSetor} onChange={set('nucleoSetor')}>
                  <option value="">Selecione…</option>
                  {Object.entries(NUCLEO_SETOR_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label} ({(NUCLEO_SETORES[id] || []).map((sid) => nomeSetor[sid] || sid).join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {msg && <div className={'aviso ' + msg.tipo} role="alert">{msg.txt}</div>}
            <button className="btn escuro" style={{ height: 52 }} disabled={ocupado}>{ocupado ? 'Enviando…' : 'Enviar solicitação'}</button>
            <button type="button" className="btn" onClick={onVoltar}>Voltar para o login</button>
          </form>
        )}
      </div>
    </div>
  )
}
