import { useState } from 'react'
import { QuestionCard } from '../components/ui.jsx'

export default function Setores({ model, sel, decidir }) {
  const [aba, setAba] = useState(model.outras[0]?.nome)
  const atual = model.outras.find((o) => o.nome === aba)
  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Referência</div>
          <h1>O que os setores já perguntam</h1>
          <p>
            Perguntas das outras abas da planilha (NEAD, Onboarding, Empregabilidade…). Use para não repetir
            perguntas. Se alguma deve entrar na CPA, marque “Entra”.
          </p>
        </div>
      </div>
      {!model.outras.length ? (
        <div className="card empty">Nenhuma outra aba com perguntas foi encontrada na planilha.</div>
      ) : (
        <>
          <div className="filters">
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {model.outras.map((o) => (
                <button key={o.nome} className={o.nome === aba ? 'on' : ''} onClick={() => setAba(o.nome)}>
                  {o.nome} · {o.perguntas.length}
                </button>
              ))}
            </div>
          </div>
          <div className="qlist">
            {atual.perguntas.map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                decisao={sel.decisoes[q.id]}
                onDecide={decidir}
                cego={false}
                extra={
                  <>
                    {q.tipo && <span className="tag">{q.tipo}</span>}
                    {q.status && <span className="tag src">{q.status}</span>}
                  </>
                }
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
