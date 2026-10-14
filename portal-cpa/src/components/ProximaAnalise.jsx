// "Analisar uma a uma": a CPA escolhe um questionário e lê as perguntas uma por vez,
// aprovando, reprovando, editando ou excluindo cada uma. Só depois disso a proposta vai para a Pró-Reitoria.
import { useState } from 'react'
import { MODALIDADES, MOD_CURTO, MARCA_MANTIDA, faltaAnaliseCpa, foiAnalisada, adaptadaDe, modsDoQuestionario } from '../lib/proxima.js'

const CORES = ['azul', 'verde', 'roxo', 'laranja']
const porPosicao = (a, b) => (a.posicao ?? 999) - (b.posicao ?? 999)

// Situação da pergunta na análise da CPA
function estadoCpa(it) {
  if (it.decisao_pr === 'aprovada') return { t: 'Já aprovada pela Pró-Reitoria', c: 'verde', k: 'ok' }
  if (it.decisao_pr === 'reprovada') return { t: 'Excluída pela Pró-Reitoria', c: 'cinza', k: 'nao' }
  if (it.decisao_cpa === 'aprovada') return { t: 'Aprovada pela CPA', c: 'verde', k: 'ok' }
  if (it.decisao_cpa === 'reprovada' || !it.incluida) return { t: 'Reprovada pela CPA', c: 'cinza', k: 'nao' }
  return { t: 'Falta analisar', c: 'laranja', k: 'falta' }
}

export default function ProximaAnalise({ ctx, Detalhe }) {
  const { dados, modo, salvarIt, excluirIt, candPorItem } = ctx
  const { itens, questionarios } = dados
  const doQ = (qid) => itens.filter((i) => i.questionario_id === qid && (i.incluida || i.decisao_cpa === 'reprovada')).sort(porPosicao)
  const faltamQ = (qid) => doQ(qid).filter(faltaAnaliseCpa).length
  const comFalta = questionarios.filter((x) => faltamQ(x.id) > 0)
  const semFalta = questionarios.filter((x) => !faltamQ(x.id))

  const [q, setQ] = useState(() => (comFalta.find((x) => x.origem === 'novo') || comFalta[0])?.id || '')
  const [mod, setMod] = useState('')
  const [soFaltam, setSoFaltam] = useState(false)
  const [atualId, setAtualId] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const escolher = (id) => {
    setQ(id)
    setMod('')
    setAtualId(null)
    setTimeout(() => document.getElementById('px-uma')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
  }

  const todas = q ? doQ(q).filter((i) => !mod || i.modalidades.includes(mod)) : []
  const lista = soFaltam ? todas.filter(faltaAnaliseCpa) : todas
  const idx = Math.max(0, lista.findIndex((i) => i.id === atualId))
  const item = lista[idx]
  const analisadas = todas.filter((i) => !faltaAnaliseCpa(i)).length
  const modsQ = q ? modsDoQuestionario(itens, q) : []
  const nomeQ = questionarios.find((x) => x.id === q)?.nome
  const pode = modo === 'cpa'

  // Depois de decidir, vai para a próxima que ainda falta analisar (ou só para a seguinte)
  const avancar = (depoisDe) => {
    const i = todas.findIndex((x) => x.id === depoisDe.id)
    const prox = [...todas.slice(i + 1), ...todas.slice(0, i)].find((x) => x.id !== depoisDe.id && faltaAnaliseCpa(x))
    setAtualId(prox?.id || todas[i + 1]?.id || depoisDe.id)
  }
  const decidir = async (patch, acao) => {
    setOcupado(true)
    const novo = await salvarIt(item, patch, acao, { texto: item.texto })
    setOcupado(false)
    if (novo) avancar(item)
  }
  const aprovar = () => {
    const cand = candPorItem[item.id]
    const marca = cand && !cand.analisada && !adaptadaDe(item) ? { observacao: MARCA_MANTIDA } : {}
    decidir({ decisao_cpa: 'aprovada', incluida: true, ...marca }, 'aprovou a pergunta (CPA)')
  }
  const reprovar = () => decidir({ decisao_cpa: 'reprovada', incluida: false }, 'reprovou a pergunta (CPA)')
  const desfazer = async () => {
    setOcupado(true)
    await salvarIt(item, { decisao_cpa: null, incluida: true, ...(foiAnalisada(item) ? { observacao: null } : {}) }, 'desfez a análise da pergunta', { texto: item.texto })
    setOcupado(false)
  }
  const excluir = async () => {
    if (!window.confirm('Excluir esta pergunta de vez da proposta?')) return
    const prox = lista[idx + 1] || lista[idx - 1]
    await excluirIt(item)
    setAtualId(prox?.id || null)
  }

  const est = item ? estadoCpa(item) : null
  const decidivel = item && !item.decisao_pr

  return (
    <>
      <section className="card px-agora" aria-label="Escolha o questionário para analisar">
        <span className="eyebrow">Analisar uma a uma</span>
        <h2>{comFalta.length ? 'Escolha o questionário e analise cada pergunta' : 'Todas as perguntas foram analisadas'}</h2>
        <p className="small muted">
          Em cada pergunta: <b>Aprovar</b>, <b>Reprovar</b>, <b>Editar</b> ou <b>Excluir</b>. O envio para a Pró-Reitoria só libera quando não faltar nenhuma.
        </p>
        {comFalta.length > 0 && (
          <div className="px-agora-grid">
            {comFalta.map((x, i) => {
              const ms = modsDoQuestionario(itens, x.id)
              const n = faltamQ(x.id)
              return (
                <button key={x.id} type="button" className={'px-novo ' + CORES[i % CORES.length] + (q === x.id ? ' sel' : '')} onClick={() => escolher(x.id)}>
                  <span className="px-novo-tag">{x.origem === 'novo' ? 'Questionário novo' : 'Questionário'} · {ms.length === MODALIDADES.length ? 'todas as modalidades' : ms.map((m) => (m === 'SEMIPRESENCIAL' ? 'Semipresencial' : MOD_CURTO[m])).join(' e ')}</span>
                  <b className="px-novo-nome">{x.nome}</b>
                  <span className="px-novo-pe">{n} {n === 1 ? 'pergunta para analisar' : 'perguntas para analisar'} <span aria-hidden="true">→</span></span>
                </button>
              )
            })}
          </div>
        )}
        {semFalta.length > 0 && (
          <div className="chips" role="group" aria-label="Questionários já analisados">
            <span className="small muted" style={{ alignSelf: 'center' }}>Já analisados:</span>
            {semFalta.map((x) => (
              <button key={x.id} type="button" className="chip-btn" aria-pressed={q === x.id} onClick={() => escolher(x.id)}>{x.nome} ✓</button>
            ))}
          </div>
        )}
      </section>

      {q && (
        <section className="card px-uma" id="px-uma" aria-label={'Perguntas de ' + nomeQ}>
          <div className="card-h">
            <div className="t">
              <span className="eyebrow">{nomeQ}</span>
              <h2>{todas.length ? `Pergunta ${todas.findIndex((x) => x.id === item?.id) + 1} de ${todas.length}` : 'Nenhuma pergunta'}</h2>
            </div>
            <div className="spacer" />
            <span className={'selo ' + (analisadas === todas.length ? 'verde' : 'laranja')}>{analisadas} de {todas.length} analisadas</span>
          </div>

          <div className="filtros">
            {modsQ.length > 1 && (
              <div className="seg" role="group" aria-label="Modalidade">
                {[['', 'Todas'], ...modsQ.map((m) => [m, MOD_CURTO[m]])].map(([k, t]) => (
                  <button key={k} aria-pressed={mod === k} onClick={() => { setMod(k); setAtualId(null) }}>{t}</button>
                ))}
              </div>
            )}
            <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={soFaltam} onChange={(e) => { setSoFaltam(e.target.checked); setAtualId(null) }} /> Só as que faltam analisar
            </label>
          </div>

          {lista.length > 0 && (
            <nav className="px-passos" aria-label="Ir para a pergunta">
              {lista.map((x) => {
                const e = estadoCpa(x)
                const n = todas.findIndex((y) => y.id === x.id) + 1
                return (
                  <button key={x.id} type="button" className={'px-passo ' + e.k} aria-current={x.id === item?.id ? 'step' : undefined} title={`${n}. ${x.texto} — ${e.t}`} onClick={() => setAtualId(x.id)}>{n}</button>
                )
              })}
            </nav>
          )}

          {!item && <p className="muted">{soFaltam ? 'Nenhuma pergunta falta analisar aqui. ✓' : 'Nenhuma pergunta neste questionário.'}</p>}

          {item && (
            <div className="px-decisao" role="group" aria-label="Decisão da CPA sobre esta pergunta">
              <span className={'selo ' + est.c}>{est.t}</span>
              <div style={{ flex: 1 }} />
              {decidivel && (
                <>
                  <button className={'btn' + (item.decisao_cpa === 'aprovada' ? ' escuro' : ' verde')} disabled={!pode || ocupado || item.decisao_cpa === 'aprovada'} onClick={aprovar}>✓ Aprovar</button>
                  <button className="btn" disabled={!pode || ocupado || est.k === 'nao'} onClick={reprovar}>✕ Reprovar</button>
                </>
              )}
              {item.origem !== 'atual' && !item.decisao_pr && <button className="btn" disabled={!pode || ocupado} onClick={excluir}>Excluir</button>}
              {decidivel && est.k !== 'falta' && <button className="btn" disabled={!pode || ocupado} onClick={desfazer}>Desfazer</button>}
            </div>
          )}
          {item && !pode && <p className="small muted">A proposta não está em montagem: só leitura.</p>}
          {item && <p className="small muted">Para editar o texto, use “Editar texto” logo abaixo. Dimensão, escala e modalidades também se ajustam ali.</p>}
        </section>
      )}

      {item && <Detalhe key={item.id} ctx={ctx} item={item} mod={mod} vizinhos={[]} semDecisao />}

      {item && (
        <div className="filtros" style={{ justifyContent: 'space-between' }}>
          <button className="btn" disabled={idx <= 0} onClick={() => setAtualId(lista[idx - 1].id)}>← Anterior</button>
          <button className="btn" disabled={idx >= lista.length - 1} onClick={() => setAtualId(lista[idx + 1].id)}>Próxima →</button>
        </div>
      )}
    </>
  )
}
