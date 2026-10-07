// Baixa a planilha "no formato do T.I" (mesmas colunas que o T.I extrai, com as colunas da 2026.2 ao lado)
import { useState } from 'react'
import { baixarPlanilhaFormatoTI } from '../lib/planilhaFormatoTI.js'

export default function BotaoFormatoTI({ dados }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)
  async function baixar() {
    setOcupado(true)
    setErro(null)
    try {
      await baixarPlanilhaFormatoTI(dados)
    } catch (e) {
      setErro(e.message || 'Não foi possível montar a planilha agora.')
    } finally {
      setOcupado(false)
    }
  }
  return (
    <>
      <button className="btn" disabled={ocupado} onClick={baixar} title="As mesmas colunas da planilha que o T.I extraiu (com os IDs das perguntas), sem respostas, e as colunas da 2026.2 ao lado">
        {ocupado ? 'Montando…' : 'Baixar no formato do T.I'}
      </button>
      {erro && <span className="small" role="alert" style={{ color: 'var(--ember-deep)' }}>{erro}</span>}
    </>
  )
}
