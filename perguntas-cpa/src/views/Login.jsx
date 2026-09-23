import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export default function Login({ modo, email: emailNegado, onEntrar, onGoogle, onSair }) {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return (
    <div className="login">
      <div className="l">
        <img src="/logo-unifecaf-branco.png" alt="UniFECAF — Seu sonho, nossa meta!" />
        <h1>Perguntas-CPA</h1>
        <p>Curadoria das perguntas do instrumento de autoavaliação, organizada pelos eixos e dimensões do SINAES.</p>
        <div className="side-deco" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <i className="t1" />
          <i className="t2" />
          <i className="t3" />
        </div>
      </div>
      <div className="r">
        {modo === 'negado' ? (
          <div style={{ maxWidth: 400 }}>
            <div className="eyebrow">Acesso</div>
            <h2>Seu e-mail ainda não está liberado</h2>
            <p className="muted">
              Você entrou como <b>{emailNegado || 'este e-mail'}</b>, que não está na lista de acesso do painel. Peça à
              Coordenação da CPA para liberar o seu e-mail e tente de novo.
            </p>
            <button className="btn" onClick={onSair}>
              Entrar com outra conta
            </button>
          </div>
        ) : modo === 'supabase' ? (
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div className="eyebrow">Acesso restrito</div>
            <h2>Entrar</h2>
            <p className="muted" style={{ fontFamily: 'var(--f-text)', fontSize: 15 }}>
              Use a sua conta Google institucional (a mesma do e-mail e do Drive da FECAF). Não é preciso criar senha.
            </p>
            <button
              className="btn google"
              disabled={indo}
              onClick={async () => {
                setErro('')
                setIndo(true)
                try {
                  await onGoogle()
                } catch (e) {
                  setErro('Não foi possível abrir o login do Google: ' + (e.message || e))
                  setIndo(false)
                }
              }}
            >
              <GoogleIcon /> {indo ? 'Abrindo o Google…' : 'Entrar com Google'}
            </button>
            {erro && <div className="banner" style={{ marginTop: 14 }}>{erro}</div>}
            <div className="note-box">
              Só entram os e-mails liberados pela Coordenação da CPA. Cada pessoa vê e edita apenas as próprias escolhas.
            </div>
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
              Este site ainda está sem login configurado, então as escolhas ficam salvas só neste navegador.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
