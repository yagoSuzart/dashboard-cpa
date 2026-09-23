import { useEffect, useMemo, useRef, useState } from 'react'
import { EIXOS, DIMENSOES, cobertura, STATUS } from '../lib/model.js'
import { escolhidasDe } from '../lib/escolhas.js'
import { carregarConsolidado } from '../lib/api.js'

const hoje = () => new Date().toLocaleDateString('pt-BR')

function origem(q) {
  if (q.fonte === 'proposta') return `Aba “${q.aba}”, linha ${q.linha}`
  if (q.fonte === 'setor') return `Aba “${q.aba}”, linha ${q.linha}`
  return q.aba
}

export default function Relatorio({ model, sessao, sel }) {
  const [pessoas, setPessoas] = useState(null)
  const [base, setBase] = useState('minhas')
  const [msg, setMsg] = useState('')
  const docRef = useRef(null)

  useEffect(() => {
    if (!sessao.admin) return
    carregarConsolidado(sessao)
      .then((d) => setPessoas(d.pessoas))
      .catch(() => setPessoas([]))
  }, [sessao])

  const outras = useMemo(() => (pessoas || []).filter((p) => p.email !== sessao.email), [pessoas, sessao.email])
  const { escolhidas, titulo } = useMemo(() => {
    const eu = { ...sel, email: sessao.email, nome: sessao.nome }
    const todos = [eu, ...outras]
    if (base === 'consenso') return { escolhidas: escolhidasDe(model, todos, 'consenso'), titulo: 'Consenso (todas marcaram “Entra”)' }
    if (base === 'uniao') return { escolhidas: escolhidasDe(model, todos, 'uniao'), titulo: 'Pelo menos uma avaliadora marcou “Entra”' }
    const p = outras.find((x) => x.email === base)
    if (p) return { escolhidas: escolhidasDe(model, [p]), titulo: `Escolhas de ${p.nome || p.email}` }
    return { escolhidas: escolhidasDe(model, [eu]), titulo: `Escolhas de ${sessao.nome || sessao.email}` }
  }, [base, model, sel, sessao, outras])

  const cob = cobertura(model, escolhidas.filter((q) => q.dim))
  const pend = cob.filter((c) => c.status !== 'coberta')

  const baixarWord = () => {
    const html = docRef.current.outerHTML.replaceAll('src="/', `src="${location.origin}/`)
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Relatório CPA</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;color:#191919}h1{color:#002156;font-size:18pt}h2{color:#002156;font-size:14pt;border-bottom:2px solid #e3e7ef;padding-bottom:4px;margin-top:22pt}h3{color:#1a3666;font-size:12pt}table{border-collapse:collapse;width:100%;margin:6pt 0}th,td{border:1px solid #c9d0dc;padding:4pt 6pt;text-align:left;vertical-align:top;font-size:10pt}th{background:#f2f5fa}.doc-head img{width:150px}</style></head><body>${html}</body></html>`
    const blob = new Blob(['﻿', doc], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `CPA_perguntas_para_TI_${new Date().toISOString().slice(0, 10)}.doc`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(docRef.current.innerText)
      setMsg('Texto copiado')
    } catch {
      setMsg('Não foi possível copiar')
    }
    setTimeout(() => setMsg(''), 2000)
  }

  const porDim = (lista, d) => lista.filter((q) => q.dim === d)

  return (
    <>
      <div className="page-h no-print">
        <div>
          <div className="eyebrow">Entrega</div>
          <h1>Relatório para o T.I</h1>
          <p>
            Documento pronto para enviar: o que já existe no instrumento, o que foi aprovado para entrar e o que ainda
            falta. Texto das perguntas sempre literal, como está na planilha.
          </p>
        </div>
        <div className="spacer" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={copiar}>
            Copiar texto
          </button>
          <button className="btn" onClick={baixarWord}>
            Baixar Word
          </button>
          <button className="btn dark" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </div>

      {sessao.admin && (
        <div className="filters no-print">
          <span className="muted" style={{ fontSize: 13 }}>
            Base do relatório:
          </span>
          <select className="select" value={base} onChange={(e) => setBase(e.target.value)}>
            <option value="minhas">Minhas escolhas</option>
            {outras.map((p) => (
              <option key={p.email} value={p.email}>
                Escolhas de {p.nome || p.email}
              </option>
            ))}
            {outras.length > 0 && <option value="consenso">Consenso — todas marcaram “Entra”</option>}
            {outras.length > 0 && <option value="uniao">União — pelo menos uma marcou “Entra”</option>}
          </select>
          {pessoas === null && <span className="muted">carregando avaliadoras…</span>}
        </div>
      )}

      <div className="doc" ref={docRef}>
        <div className="doc-head">
          <img src="/logo-unifecaf.png" alt="UniFECAF" />
          <div>
            <h1>CPA — Perguntas para o instrumento de avaliação</h1>
            <div style={{ color: '#667085' }}>
              {titulo} · gerado em {hoje()}
            </div>
          </div>
        </div>

        <p>
          Olá! Este documento reúne as perguntas que a CPA já aplica hoje (instrumento 2026.1) e as perguntas novas que
          a Pró-Reitoria Acadêmica e a Coordenação da CPA entenderam que devem entrar, para atender os 5 eixos e as 10
          dimensões do SINAES (Lei nº 10.861/2004). As perguntas atuais continuam como estão cadastradas.
        </p>
        <table>
          <tbody>
            <tr>
              <th>Perguntas em uso hoje</th>
              <td>{model.atual.length}</td>
              <th>Perguntas novas para cadastrar</th>
              <td>{escolhidas.length}</td>
            </tr>
            <tr>
              <th>Dimensões sem pergunta (depois)</th>
              <td>{cob.filter((c) => c.status === 'pendente').length}</td>
              <th>Dimensões com só 1 pergunta</th>
              <td>{cob.filter((c) => c.status === 'fraca').length}</td>
            </tr>
          </tbody>
        </table>

        <h2>1. Perguntas novas para cadastrar</h2>
        {escolhidas.length === 0 ? (
          <p style={{ color: '#667085' }}>Nenhuma pergunta marcada como “Entra” nesta base.</p>
        ) : (
          <>
            {EIXOS.map((e) => {
              const qs = escolhidas.filter((q) => q.eixo === e.n && q.dim)
              if (!qs.length) return null
              return (
                <div key={e.n}>
                  <h3>
                    Eixo {e.n} — {e.nome}
                  </h3>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '48%' }}>Pergunta (texto literal)</th>
                        <th>Dimensão</th>
                        <th>Origem</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.dims.flatMap((d) =>
                        porDim(qs, d).map((q) => (
                          <tr key={q.id}>
                            <td>{q.text}</td>
                            <td>
                              D{d} — {DIMENSOES[d]}
                            </td>
                            <td>{origem(q)}</td>
                            <td>
                              {q.notas.map((n, i) => (
                                <div key={i}>
                                  <b>{n.quem}:</b> {n.nota}
                                </div>
                              ))}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {escolhidas.some((q) => !q.dim) && (
              <>
                <h3>Dimensão a definir</h3>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '60%' }}>Pergunta (texto literal)</th>
                      <th>Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escolhidas
                      .filter((q) => !q.dim)
                      .map((q) => (
                        <tr key={q.id}>
                          <td>{q.text}</td>
                          <td>{origem(q)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        <h2>2. Cobertura dos eixos e dimensões</h2>
        <table>
          <thead>
            <tr>
              <th>Eixo</th>
              <th>Dimensão</th>
              <th>Em uso</th>
              <th>Novas</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {EIXOS.flatMap((e) =>
              e.dims.map((d) => {
                const c = cob.find((x) => x.dim === d)
                return (
                  <tr key={d}>
                    <td>Eixo {e.n}</td>
                    <td>
                      D{d} — {DIMENSOES[d]}
                    </td>
                    <td>{c.emUso}</td>
                    <td>{c.sel}</td>
                    <td>{STATUS[c.status].rotulo}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
        {pend.length > 0 && (
          <p>
            <b>Ainda precisa de atenção:</b>{' '}
            {pend.map((c) => `D${c.dim} — ${DIMENSOES[c.dim]} (${STATUS[c.status].rotulo.toLowerCase()})`).join('; ')}.
          </p>
        )}

        <h2>3. Perguntas que já estão em uso (manter como estão)</h2>
        {EIXOS.map((e) => (
          <div key={e.n}>
            <h3>
              Eixo {e.n} — {e.nome}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Pergunta (texto literal)</th>
                  <th>Dimensão</th>
                  <th>Item da pesquisa</th>
                  <th>Modalidades</th>
                </tr>
              </thead>
              <tbody>
                {model.atual
                  .filter((q) => q.eixo === e.n)
                  .sort((a, b) => (a.dim || 99) - (b.dim || 99))
                  .map((q) => (
                    <tr key={q.id}>
                      <td>{q.text}</td>
                      <td>{q.dim ? `D${q.dim} — ${DIMENSOES[q.dim]}` : q.dimTexto || 'a revisar'}</td>
                      <td>{q.item}</td>
                      <td>{q.modalidades.join(', ')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {msg && <div className="toast">{msg}</div>}
    </>
  )
}
