import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// Depois de um deploy novo, uma aba aberta antes dele pede arquivos que não existem mais.
// Recarrega uma vez para pegar a versão nova (a trava evita recarregar em loop).
window.addEventListener('vite:preloadError', (ev) => {
  let ultima = 0
  try { ultima = Number(sessionStorage.getItem('cpa-recarga') || 0) } catch { /* sem storage */ }
  if (Date.now() - ultima < 30000) return
  try { sessionStorage.setItem('cpa-recarga', String(Date.now())) } catch { /* sem storage */ }
  ev.preventDefault()
  location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
