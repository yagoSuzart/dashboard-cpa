import { useState } from 'react'
import { entrar, esqueciSenha, trocarSenha } from '../lib/dados.js'

export default function Login({ onSolicitar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setMsg(null)
    setOcupado(true)
    try {
      await entrar(email, senha)
    } catch (err) {
      setMsg({ tipo: 'erro', txt: err.message })
    } finally {
      setOcupado(false)
    }
  }
  const esqueci = async () => {
    if (!email.trim()) return setMsg({ tipo: 'erro', txt: 'Digite o seu e-mail no campo acima e clique de novo em "Esqueci a senha".' })
    try {
      await esqueciSenha(email)
      setMsg({ tipo: 'ok', txt: 'Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.' })
    } catch (err) {
      setMsg({ tipo: 'erro', txt: err.message })
    }
  }

  return (
    <div className="login">
      <div className="foto">
        <img className="bg" src="/campus.jpg" alt="" />
        <div className="dentro">
          <img src="/logo-unifecaf-branco.png" alt="UniFECAF" style={{ width: 168 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div className="eyebrow" style={{ color: '#9FE0B8' }}>Comissão Própria de Avaliação</div>
            <h1>A voz da comunidade acadêmica.</h1>
            <div className="stats">
              <div><b>Resultados</b><span>por curso, turma e pergunta</span></div>
              <div><b>Comentários</b><span>como os alunos escreveram</span></div>
              <div><b>Planos</b><span>do envio à conclusão</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="form">
        <form onSubmit={enviar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="eyebrow">Portal CPA</div>
            <h2 style={{ fontSize: 40, lineHeight: 1.1 }}>Bom te ver por aqui.</h2>
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.55 }}>
              Resultados, planos de ação e comentários da CPA num lugar só. Entre com o seu e-mail e a sua senha.
            </p>
          </div>
          <div className="campo">
            <label htmlFor="lg-email">E-mail institucional</label>
            <input id="lg-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o e-mail que você usa na UniFECAF" />
          </div>
          <div className="campo">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="lg-senha">Senha</label>
              <button type="button" onClick={() => setVer(!ver)} style={{ border: 0, background: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: 13, padding: 0 }}>
                {ver ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input id="lg-senha" type={ver ? 'text' : 'password'} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" />
          </div>
          {msg && <div className={'aviso ' + msg.tipo} role="alert">{msg.txt}</div>}
          <button className="btn escuro" style={{ height: 52 }} disabled={ocupado}>{ocupado ? 'Entrando…' : 'Entrar no Portal'}</button>
          <button type="button" className="btn" onClick={esqueci}>Esqueci a senha</button>
          {onSolicitar && (
            <p className="small muted" style={{ textAlign: 'center' }}>
              Ainda não tem acesso?{' '}
              <button type="button" onClick={onSolicitar} style={{ border: 0, background: 'none', color: 'var(--navy)', fontWeight: 700, padding: 0, cursor: 'pointer' }}>Solicitar acesso</button>
            </p>
          )}
          <p className="small muted" style={{ textAlign: 'center' }}>No primeiro acesso, o Portal pergunta se você quer trocar a sua senha.</p>
        </form>
      </div>
    </div>
  )
}

export function TrocarSenha({ onFim }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [msg, setMsg] = useState(null)
  const enviar = async (e) => {
    e.preventDefault()
    if (a.length < 8) return setMsg('A senha precisa ter pelo menos 8 caracteres.')
    if (a !== b) return setMsg('As duas senhas não são iguais.')
    try {
      await trocarSenha(a)
      onFim()
    } catch (err) {
      setMsg(err.message)
    }
  }
  return (
    <div className="centro">
      <form onSubmit={enviar} style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <h2>Crie a sua nova senha</h2>
        <div className="campo">
          <label htmlFor="ns1">Nova senha</label>
          <input id="ns1" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ns2">Repita a nova senha</label>
          <input id="ns2" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
        {msg && <div className="aviso erro" role="alert">{msg}</div>}
        <button className="btn escuro">Salvar senha</button>
      </form>
    </div>
  )
}
