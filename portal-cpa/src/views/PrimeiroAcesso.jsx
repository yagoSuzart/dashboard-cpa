import { useEffect, useState } from 'react'
import { precisaPrimeiroAcesso, marcarPrimeiroAcessoOk, definirNovaSenha } from '../lib/admin.js'
import './admin.css'

// Janela de primeiro acesso, como no sistema anterior: aparece enquanto usuarios.primeiro_acesso_ok
// não for true (conta criada com a senha padrão ou senha resetada pelo Gestor Técnico).
// A pessoa escolhe manter a senha atual ou definir uma nova; nas duas opções a flag vira true.
// Nenhuma senha é comparada nem escrita no navegador: quem decide é a flag do banco.
// Se o perfil já trouxer primeiroAcessoOk (boolean), a consulta ao banco é dispensada.
export default function PrimeiroAcesso({ perfil, onFim }) {
  const jaSabe = typeof perfil?.primeiroAcessoOk === 'boolean'
  const [aberto, setAberto] = useState(jaSabe ? !perfil.primeiroAcessoOk : null)
  const [form, setForm] = useState(false)
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [ver, setVer] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const id = perfil?.id
  useEffect(() => {
    if (jaSabe || !id) return
    let vivo = true
    precisaPrimeiroAcesso(id).then((p) => vivo && setAberto(p))
    return () => {
      vivo = false
    }
  }, [id, jaSabe])

  if (!aberto) return null

  const manter = async () => {
    setOcupado(true)
    try {
      await marcarPrimeiroAcessoOk(id)
    } catch (e) {
      console.error('Falha ao marcar primeiro acesso:', e)
    }
    setOcupado(false)
    setAberto(false)
    onFim?.({ trocou: false, mensagem: 'Combinado, você continua com a senha atual.' })
  }

  const salvar = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!nova || nova.length < 8) return setMsg('A nova senha precisa ter no mínimo 8 caracteres.')
    if (nova !== confirma) return setMsg('As senhas não coincidem.')
    setOcupado(true)
    try {
      await definirNovaSenha(id, nova)
      setAberto(false)
      onFim?.({ trocou: true, mensagem: 'Senha alterada com sucesso! Use a nova senha no próximo acesso.' })
    } catch (err) {
      setMsg('Não foi possível salvar a nova senha agora: ' + (err.message || 'erro desconhecido'))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="pa-titulo">
      <form className="modal" style={{ maxWidth: 460 }} onSubmit={salvar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="eyebrow">Primeiro acesso</div>
          <h2 id="pa-titulo" style={{ fontSize: 28, lineHeight: 1.15 }}>Quer escolher uma senha só sua?</h2>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Este é o seu primeiro acesso ao Portal. Quer definir uma senha só sua, ou prefere manter a senha atual por enquanto?
          </p>
        </div>
        {form && (
          <>
            <div className="campo">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="pa-nova">Nova senha</label>
                <button type="button" className="adm-link" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Mostrar'}</button>
              </div>
              <input id="pa-nova" type={ver ? 'text' : 'password'} autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Mínimo 8 caracteres" autoFocus />
            </div>
            <div className="campo">
              <label htmlFor="pa-confirma">Confirmar nova senha</label>
              <input id="pa-confirma" type={ver ? 'text' : 'password'} autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder="Repita a senha" />
            </div>
          </>
        )}
        {msg && <div className="aviso erro" role="alert">{msg}</div>}
        {form ? (
          <button className="btn escuro" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar nova senha'}</button>
        ) : (
          <div className="adm-acoes">
            <button type="button" className="btn" style={{ flex: 1 }} onClick={manter} disabled={ocupado}>Manter a senha atual</button>
            <button type="button" className="btn escuro" style={{ flex: 1 }} onClick={() => setForm(true)}>Definir nova senha</button>
          </div>
        )}
      </form>
    </div>
  )
}
