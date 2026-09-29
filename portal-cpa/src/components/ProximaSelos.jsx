// Selos de eixo e dimensão (SINAES) e o critério avaliativo (escala) de uma pergunta.
// Usado na Próxima CPA e nas telas de resultados (Pergunta por pergunta e Questionários).
import { EIXO_DA_DIM, ESCALAS, MOD_CURTO, rotuloEixo, rotuloDim, escalasPorModalidade, nomeEscala } from '../lib/proxima.js'
import '../views/proxima.css'

export function SelosEixoDim({ eixo, dimensao, vazio = true }) {
  const e = eixo || (dimensao ? EIXO_DA_DIM[dimensao] : null)
  if (!e && !dimensao) return vazio ? <span className="selo laranja px-selo">sem eixo e dimensão</span> : null
  return (
    <>
      {e && <span className="selo escuro px-selo" title="Eixo do SINAES">{rotuloEixo(e)}</span>}
      {dimensao ? <span className="selo azul px-selo" title="Dimensão do SINAES">{rotuloDim(dimensao)}</span> : <span className="selo laranja px-selo">sem dimensão</span>}
    </>
  )
}

// Mostra as alternativas que o aluno vê
export function Alternativas({ escala }) {
  const E = ESCALAS[escala]
  if (!E) return null
  if (escala === 'aberta') return <div className="px-alt"><span className="px-alt-aberta">texto livre</span></div>
  return (
    <div className="px-alt" aria-label={'Alternativas: ' + E.d}>
      {E.valores.map((v) => (
        <span key={v} className="px-alt-v" title={E.ancoras[v] || undefined}>
          <b>{v}</b>
          {E.ancoras[v] && <small>{E.ancoras[v]}</small>}
        </span>
      ))}
      {E.na && <span className="px-alt-v na"><b>Não sei / Não utilizo</b><small>fora da média</small></span>}
    </div>
  )
}

export function EscalaResumo({ item, mods }) {
  const grupos = escalasPorModalidade(item, mods)
  return (
    <span className="px-escala-resumo">
      {grupos.map(([e, ms]) => (
        <span key={e} className="selo cinza px-selo">
          {grupos.length > 1 || ms.length < 3 ? ms.map((m) => MOD_CURTO[m]).join(', ') + ': ' : ''}
          {nomeEscala(e)}
        </span>
      ))}
    </span>
  )
}
