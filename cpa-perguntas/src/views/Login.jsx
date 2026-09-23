import { useState } from 'react'

export default function Login({ onEntrar, negado }) {
  const [email, setEmail] = useState('')
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return (
    <div className="login">
      <div className="l">
        <img src="/logo-unifecaf-branco.png" alt="UniFECAF — Seu sonho, nossa meta!" />
        <h1>Banco de Perguntas da CPA</h1>
        <p>Curadoria das perguntas do instrumento de autoavaliação, organizada pelos eixos e dimensões do SINAES.</p>
        <div className="side-deco" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <i className="t1" />
          <i className="t2" />
          <i className="t3" />
        </div>
      </div>
      <div className="r">
        {negado ? (
          <div style={{ maxWidth: 380 }}>
            <h2>Acesso não autorizado</h2>
            <p className="muted">
              Seu e-mail não está na lista de acesso deste painel. Fale com a Coordenação da CPA.
            </p>
            <a className="btn" href="/cdn-cgi/access/logout">
              Entrar com outro e-mail
            </a>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (valido) onEntrar(email.trim().toLowerCase())
            }}
          >
            <div className="eyebrow">Modo demonstração</div>
            <h2>Entrar</h2>
            <label htmlFor="email">E-mail institucional</label>
            <input
              id="email"
              type="email"
              placeholder="nome@fecaf.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <button className="btn primary" style={{ width: '100%', marginTop: 16, padding: 12 }} disabled={!valido}>
              Entrar sem senha
            </button>
            <div className="note-box">
              Este site ainda está sem o login do Cloudflare configurado, então as escolhas ficam salvas só neste
              navegador. Depois de publicado com o Cloudflare Access, o login é por e-mail com um código de acesso, e
              cada pessoa tem as suas escolhas separadas.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
