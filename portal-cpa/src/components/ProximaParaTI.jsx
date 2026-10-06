// "Para o T.I": o que entra, o que sai, o que muda e o que se mantém no instrumento, já com as decisões
// da Pró-Reitoria (só leitura). Pode ser baixado (CSV) ou impresso para enviar ao T.I.
import { useState } from 'react'
import {
  ATUAL_POR_ID, MODALIDADES, MOD_CURTO, STATUS, adaptadaDe, classificarTI as classificar, GRUPOS_TI as GRUPOS, decisaoPr as decisao, motivoSaida, escalaDoItem, escalaMudou, escalaOriginal,
  modalidadesMudaram, nomeEscala, prefixoOriginal, prefixosAlterados, rotuloDim, rotuloEixo, EIXO_DA_DIM, textoNaModalidade,
} from '../lib/proxima.js'

const mods = (l) => MODALIDADES.filter((m) => l.includes(m)).map((m) => MOD_CURTO[m]).join(', ')

function origemDe(it) {
  if (it.adicionada_pr) return 'Escrita pela Pró-Reitoria'
  if (adaptadaDe(it)) return adaptadaDe(it)
  if (it.origem === 'banco') return 'Do banco de perguntas'
  if (it.origem === 'nova') return 'Escrita pela CPA'
  return ''
}

function oQueMuda(it) {
  const out = []
  if (it.texto !== it.texto_original) out.push('texto')
  if (modalidadesMudaram(it)) out.push(`modalidades (hoje: ${mods(ATUAL_POR_ID[it.atual_id]?.modalidades || [])})`)
  if (escalaMudou(it)) out.push(`escala (hoje: ${nomeEscala(escalaOriginal({ ...it, escala: null }, it.modalidades[0]))})`)
  return out.join(' · ')
}

export default function ProximaParaTI({ ctx }) {
  const { dados, nomes } = ctx
  const { itens, questionarios, proposta } = dados
  const [q, setQ] = useState('')
  const [abertos, setAbertos] = useState({ entra: true, sai: true, muda: true, mantem: true })
  const nomeQ = Object.fromEntries(questionarios.map((x) => [x.id, x.nome]))
  const ordemQ = Object.fromEntries(questionarios.map((x, i) => [x.id, i]))
  const lista = itens
    .filter((i) => !q || i.questionario_id === q)
    .sort((a, b) => (ordemQ[a.questionario_id] ?? 99) - (ordemQ[b.questionario_id] ?? 99) || (a.posicao ?? 999) - (b.posicao ?? 999))
  const por = { entra: [], sai: [], muda: [], mantem: [] }
  for (const it of lista) por[classificar(it)].push(it)
  const prefMud = prefixosAlterados(dados.prefixos).filter((r) => !q || r.questionario_id === q)
  const incluidas = itens.filter((i) => i.incluida)
  const decididas = incluidas.filter((i) => i.decisao_pr).length
  const aprovada = ['aprovada', 'enviada_ti'].includes(proposta.status)

  const baixar = () => {
    const cab = ['Situação', 'Questionário', 'Modalidades', 'Pergunta (texto final)', 'Texto de hoje', 'O que muda', 'Critério avaliativo (escala)', 'Eixo', 'Dimensão', 'Decisão da Pró-Reitoria', 'Origem / motivo']
    const linhas = []
    for (const k of ['entra', 'sai', 'muda', 'mantem']) {
      for (const it of por[k]) {
        const esc = escalaDoItem(it, it.modalidades[0])
        linhas.push([
          GRUPOS[k].t, nomeQ[it.questionario_id] || 'A definir', mods(it.modalidades),
          k === 'sai' ? '' : textoNaModalidade(it, it.modalidades[0]),
          it.origem === 'atual' ? it.texto_original : '',
          k === 'muda' ? oQueMuda(it) : '',
          it.tipo === 'aberta' ? 'Resposta aberta' : nomeEscala(esc),
          rotuloEixo(it.eixo || EIXO_DA_DIM[it.dimensao]) || '', rotuloDim(it.dimensao) || '',
          decisao(it), k === 'sai' ? motivoSaida(it) : origemDe(it),
        ])
      }
    }
    for (const r of prefMud) linhas.push(['Enunciado muda', nomeQ[r.questionario_id] || r.questionario_id, MOD_CURTO[r.modalidade], r.texto, r.texto_original ?? prefixoOriginal(r.questionario_id, r.modalidade), 'enunciado (prefixo)', '', '', '', '', ''])
    const esc = (v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
    const url = URL.createObjectURL(new Blob(['﻿' + [cab, ...linhas].map((l) => l.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `proxima-cpa-para-o-ti${q ? '-' + q : ''}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="coluna px-ti">
      <section className="card" style={{ gap: 14 }}>
        <div className="card-h">
          <div className="t">
            <span className="eyebrow">Para o T.I</span>
            <h2>O que entra, o que sai, o que muda</h2>
            <p className="muted small">Comparado com o instrumento de hoje (2026.1), já com as decisões da Pró-Reitoria. Situação da proposta: {STATUS[proposta.status].t}{proposta.decidido_em && aprovada ? ` · aprovada por ${nomes[proposta.decidido_por] || '—'} em ${new Date(proposta.decidido_em).toLocaleDateString('pt-BR')}` : ''}.</p>
          </div>
          <div className="spacer" />
          <div className="filtros no-print" style={{ gap: 8 }}>
            <button className="btn" onClick={baixar}>Baixar planilha (CSV)</button>
            <button className="btn escuro" onClick={() => window.print()}>Imprimir / PDF</button>
          </div>
        </div>
        {!aprovada && (
          <div className="aviso" role="note">
            <span>
              A Pró-Reitoria marcou <b>{decididas} de {incluidas.length}</b> perguntas, mas a proposta ainda não foi aprovada no Portal (botão “Aprovar a proposta”).
              O que ela não marcou aparece como a CPA propôs. Esta é uma prévia: o que ela já aprovou, editou ou excluiu já está aqui.
            </span>
          </div>
        )}
        <div className="filtros no-print">
          <label className="small" htmlFor="ti-q" style={{ fontWeight: 700 }}>Questionário</label>
          <select id="ti-q" className="input" style={{ height: 38, fontSize: 14, maxWidth: 360 }} value={q} onChange={(e) => setQ(e.target.value)}>
            <option value="">Todos os questionários</option>
            {questionarios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        </div>
        <div className="px-ti-cont">
          {Object.entries(GRUPOS).map(([k, g]) => (
            <a key={k} href={'#ti-' + k} className={'px-ti-n ' + g.c} onClick={(e) => { e.preventDefault(); setAbertos((x) => ({ ...x, [k]: true })); setTimeout(() => document.getElementById('ti-' + k)?.scrollIntoView({ behavior: 'smooth' }), 30) }}>
              <b>{por[k].length}</b><span>{g.t}</span>
            </a>
          ))}
          <div className="px-ti-n roxo"><b>{prefMud.length}</b><span>Enunciados mudam</span></div>
        </div>
      </section>

      {prefMud.length > 0 && (
        <section className="card" style={{ gap: 10 }}>
          <h2>Enunciados (prefixos) que mudam</h2>
          <table className="tabela">
            <thead><tr><th>Questionário</th><th>Modalidade</th><th>Fica</th><th>Hoje</th></tr></thead>
            <tbody>
              {prefMud.map((r) => (
                <tr key={r.questionario_id + r.modalidade}>
                  <td>{nomeQ[r.questionario_id] || r.questionario_id}</td><td>{MOD_CURTO[r.modalidade]}</td>
                  <td><b>{r.texto}</b></td><td className="muted"><del>{r.texto_original ?? prefixoOriginal(r.questionario_id, r.modalidade)}</del></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {Object.entries(GRUPOS).map(([k, g]) => (
        <section key={k} id={'ti-' + k} className="card" style={{ gap: 10 }}>
          <div className="card-h">
            <div className="t"><h2>{g.t} ({por[k].length})</h2><p className="muted small">{g.d}</p></div>
            <div className="spacer" />
            <button className="btn sm no-print" onClick={() => setAbertos((x) => ({ ...x, [k]: !x[k] }))}>{abertos[k] ? 'Esconder' : 'Mostrar'}</button>
          </div>
          {abertos[k] && (por[k].length ? (
            <div className="rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Questionário</th><th>Modalidades</th>
                    <th>{k === 'sai' ? 'Pergunta que sai' : 'Pergunta (texto final)'}</th>
                    {k === 'muda' && <th>Hoje</th>}
                    <th>Escala</th><th>Eixo e dimensão</th>
                    <th>{k === 'sai' ? 'Motivo' : 'Pró-Reitoria'}</th>
                  </tr>
                </thead>
                <tbody>
                  {por[k].map((it) => {
                    const esc = escalaDoItem(it, it.modalidades[0])
                    return (
                      <tr key={it.id}>
                        <td>{nomeQ[it.questionario_id] || 'A definir'}</td>
                        <td className="small">{mods(it.modalidades)}</td>
                        <td>
                          {k === 'sai' ? <del>{it.texto}</del> : textoNaModalidade(it, it.modalidades[0])}
                          {k === 'entra' && origemDe(it) && <div className="small muted">{origemDe(it)}</div>}
                          {k === 'muda' && <div className="small muted">Muda: {oQueMuda(it)}</div>}
                        </td>
                        {k === 'muda' && <td className="small muted">{it.texto !== it.texto_original ? <del>{it.texto_original}</del> : 'mesmo texto'}</td>}
                        <td className="small">{it.tipo === 'aberta' ? 'Resposta aberta' : nomeEscala(esc)}</td>
                        <td className="small">{it.dimensao ? <>{rotuloEixo(it.eixo || EIXO_DA_DIM[it.dimensao])}<br />{rotuloDim(it.dimensao)}</> : '—'}</td>
                        <td className="small">{k === 'sai' ? motivoSaida(it) : decisao(it)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="muted small">Nada aqui{q ? ' neste questionário' : ''}.</p>)}
        </section>
      ))}
    </div>
  )
}
