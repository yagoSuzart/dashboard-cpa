// Perguntas da próxima CPA — página pública (sem login) para os coordenadores verem, antes da aplicação, o que os
// alunos de cada modalidade vão responder: questionário por questionário, com o enunciado e as perguntas.
// Os dados vêm da função do banco cpa_perguntas_publico (só a proposta mais recente e só o que entra).
import { useEffect, useState } from 'react'
import { sb } from '../lib/dados.js'
import { prefixoDe, textoNaModalidade } from '../lib/proxima.js'
import './retorno.css'

const MODS = [
  ['ead', 'EAD', 'EAD'],
  ['semi', 'SEMIPRESENCIAL', 'Semi'],
  ['presencial', 'PRESENCIAL', 'Presencial'],
]
const ordem = (a, b) => (a.tipo === 'aberta') - (b.tipo === 'aberta') || (a.posicao ?? 999) - (b.posicao ?? 999)
const ESCOLHA = [
  ['ead', 'EAD', 'Ver questionários e perguntas'],
  ['semi', 'Semipresencial', 'Ver questionários e perguntas'],
  ['presencial', 'Presencial', 'Ver questionários e perguntas'],
]
const FECHADA = ['aprovada', 'enviada_ti']
const NOTA = { satisfacao_geral: 'Nota de 0 a 10' }
const AVISO = { novo_clinica_escola: 'Só para os cursos com clínica-escola.', novo_polo_aulas_praticas: 'Sobre o polo onde o aluno faz as aulas práticas.' }

export default function PerguntasPublico({ param }) {
  // Sem modalidade no link (o QR code), a página abre na escolha: EAD, Semipresencial ou Presencial
  const mod = MODS.find((m) => m[0] === String(param || '').toLowerCase())?.[0] || null
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    sb.rpc('cpa_perguntas_publico').then(({ data, error }) => {
      if (!vivo) return
      if (error) setErro(true)
      else setDados(data)
    })
    return () => {
      vivo = false
    }
  }, [])

  const trocar = (k) => {
    window.location.assign(`#/perguntas/${k}`)
    window.scrollTo(0, 0)
  }
  const [, M, nomeMod] = MODS.find((m) => m[0] === mod) || []
  const grupos = dados && M
    ? dados.questionarios
        .map((q) => ({ q, itens: dados.itens.filter((i) => i.questionario_id === q.id && i.modalidades?.includes(M)).sort(ordem) }))
        .filter((g) => g.itens.length)
    : []
  const total = grupos.reduce((s, g) => s + g.itens.filter((i) => i.tipo !== 'aberta').length, 0)

  return (
    <div className="rt">
      <header className="rt-topo">
        <img src="/logo-unifecaf-branco.png" alt="UniFECAF" className="rt-logo" />
        <span className="rt-pilula">Próxima CPA</span>
      </header>

      <section className="rt-hero">
        <span className="rt-eyebrow">Para os coordenadores · sem surpresas</span>
        <h1>O que os alunos vão responder na próxima CPA.</h1>
        <p>{mod ? 'Veja cada questionário com as perguntas, do jeito que o aluno vai ler.' : 'Escolha o modelo de oferta para ver os questionários e as perguntas.'}</p>
        {mod && (
          <div className="pq-abas" role="tablist" aria-label="Modalidade">
            {MODS.map(([k, , t]) => (
              <button key={k} role="tab" aria-selected={mod === k} onClick={() => trocar(k)}>{t}</button>
            ))}
          </div>
        )}
      </section>

      <main className="rt-corpo">
        {!mod ? (
          <div className="pq-escolha">
            {ESCOLHA.map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => trocar(k)}>
                <b>{t}</b>
                <span>{d}</span>
                <i aria-hidden="true">→</i>
              </button>
            ))}
          </div>
        ) : erro ? (
          <div className="rt-vazio">Não foi possível carregar as perguntas agora. Tente de novo em instantes.</div>
        ) : !dados ? (
          <div className="rt-vazio">Carregando…</div>
        ) : (
          <>
            <div className="pq-resumo">
              <span><b>{grupos.length}</b> questionários</span>
              <span><b>{total}</b> perguntas de nota</span>
              <span>+ espaço para comentário</span>
            </div>
            {!FECHADA.includes(dados.status) && (
              <div className="pq-aviso">Versão em revisão pela CPA e pela Pró-Reitoria: alguma pergunta ainda pode mudar. Esta página se atualiza sozinha.</div>
            )}
            {grupos.map(({ q, itens }, gi) => {
              const notas = itens.filter((i) => i.tipo !== 'aberta')
              const abertas = itens.filter((i) => i.tipo === 'aberta')
              return (
                <details key={q.id} className={'pq-q' + (q.origem === 'novo' ? ' novo' : '')} open={gi === 0}>
                  <summary>
                    <span className="pq-n">{String(gi + 1).padStart(2, '0')}</span>
                    <span className="pq-tit">
                      <b>{q.nome}</b>
                      <small>
                        {notas.length} {notas.length === 1 ? 'pergunta' : 'perguntas'}
                        {abertas.length ? ' · comentário' : ''}
                        {NOTA[q.id] ? ` · ${NOTA[q.id]}` : ''}
                      </small>
                    </span>
                    {q.origem === 'novo' && <span className="pq-novo">Novo</span>}
                  </summary>
                  {AVISO[q.id] && <p className="pq-obs">{AVISO[q.id]}</p>}
                  {prefixoDe(dados.prefixos, q.id, M) && <p className="pq-enunciado">{prefixoDe(dados.prefixos, q.id, M)}</p>}
                  <ol>
                    {notas.map((i, k) => <li key={k}>{textoNaModalidade(i, M).replace(/\s*\?$/, '')}</li>)}
                  </ol>
                  {abertas.map((i, k) => (
                    <div key={k} className="pq-aberta"><span>✎ Comentário</span>{textoNaModalidade(i, M)}</div>
                  ))}
                </details>
              )
            })}
            <p className="pq-rodape-txt">Modalidade: <b>{nomeMod === 'Semi' ? 'Semipresencial' : nomeMod}</b>. As respostas dos alunos são anônimas.</p>
          </>
        )}
      </main>
      <footer className="rt-rodape">CPA UniFECAF · Comissão Própria de Avaliação</footer>
    </div>
  )
}
