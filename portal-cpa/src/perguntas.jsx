/* eslint-disable react-refresh/only-export-components -- arquivo de entrada da página, não é componente recarregável */
// Página separada das perguntas da próxima CPA (/perguntas/), aberta pelo QR code: livre acesso, sem login e sem
// nada do Portal. A modalidade escolhida vai no fim do link (#ead, #semi, #presencial), para o voltar do celular funcionar.
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import PerguntasPublico from './views/PerguntasPublico.jsx'

const lerHash = () => location.hash.replace(/^#\/?(perguntas\/)?/, '')

function Pagina() {
  const [mod, setMod] = useState(lerHash)
  useEffect(() => {
    const onHash = () => setMod(lerHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return <PerguntasPublico param={mod} base="#" />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Pagina />
  </StrictMode>,
)
