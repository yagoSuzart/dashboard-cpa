import { fmtInt } from '../lib/cpa.js'
import { SITUACOES, contarSituacoes } from '../lib/planos.js'

// Quadro de situação dos planos: um número por status real, sempre somando o total.
// ('rascunho' conta como aguardando a validação da CPA.)
export default function PlanoSituacao({ planos, ativo, onEscolher }) {
  const c = contarSituacoes(planos)
  return (
    <div className="plano-situacao" role="group" aria-label="Situação dos planos">
      {SITUACOES.map((s) => {
        const conteudo = (
          <>
            <span className="q">{fmtInt(c[s.k])}</span>
            <span className="n">{s.t}</span>
          </>
        )
        return onEscolher ? (
          <button key={s.k} type="button" className={'ps-item ps-' + s.k} aria-pressed={ativo === s.k} onClick={() => onEscolher(ativo === s.k ? '' : s.k)}>
            {conteudo}
          </button>
        ) : (
          <div key={s.k} className={'ps-item ps-' + s.k}>{conteudo}</div>
        )
      })}
    </div>
  )
}

// Selos por situação de uma pessoa (ex.: 3 aguardando · 2 devolvidos · 1 com a Pró-Reitoria · 0 aprovados)
const SEMPRE = ['enviado', 'devolvido', 'aguardando_pro_reitoria', 'aprovado']
export function SelosSituacao({ planos }) {
  const c = contarSituacoes(planos)
  return (
    <span className="plano-selos" aria-label="Situação dos planos desta pessoa">
      {SITUACOES.filter((s) => SEMPRE.includes(s.k) || c[s.k] > 0).map((s) => (
        <span key={s.k} className={'selo ' + (c[s.k] ? s.c : 'cinza')} title={s.t}>
          {fmtInt(c[s.k])} {s.curto}
        </span>
      ))}
    </span>
  )
}
