// Enunciado (prefixo) que aparece antes das perguntas de um questionário, por modalidade.
import { useState } from 'react'
import { MODALIDADES, MOD_CURTO, prefixoDe, prefixoOriginal, linhaPrefixo, sugestoesPrefixo, salvarPrefixo, registrar, comPrefixo, entra, modsDoQuestionario, gruposPrefixo } from '../lib/proxima.js'

export default function ProximaPrefixo({ ctx, qid, nomeQ }) {
  const { perfil, dados, modo, setDados, setAviso } = ctx
  const prefixos = dados.prefixos || []
  const modsQ = modsDoQuestionario(dados.itens, qid)
  const mods = modsQ.length ? modsQ : MODALIDADES
  const grupos = gruposPrefixo(prefixos, qid, mods)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [alvo, setAlvo] = useState(mods)
  const [ocupado, setOcupado] = useState(false)
  const editavel = modo !== 'leitura'
  const exemplo = dados.itens.filter((i) => i.questionario_id === qid && entra(i) && i.tipo !== 'aberta').sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))[0]

  const abrir = (t, ms) => {
    setTexto(t)
    setAlvo(ms)
    setEditando(true)
  }
  const salvar = async () => {
    setOcupado(true)
    try {
      let lista = [...prefixos]
      const antes = alvo.map((m) => prefixoDe(prefixos, qid, m))
      for (const m of alvo) {
        const novo = await salvarPrefixo(dados.proposta.id, lista, qid, m, texto.trim(), perfil.id)
        lista = [...lista.filter((r) => !(r.questionario_id === qid && r.modalidade === m)), novo]
      }
      setDados((d) => ({ ...d, prefixos: lista }))
      registrar(dados.proposta.id, perfil.id, 'alterou o prefixo', { texto: texto.trim(), antes: antes[0], questionario: nomeQ, modalidades: alvo })
      setEditando(false)
      setAviso({ tipo: 'ok', txt: `Enunciado de “${nomeQ}” salvo para ${alvo.map((m) => MOD_CURTO[m]).join(', ')}.` })
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível salvar o enunciado: ' + (e.message || e) })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="card px-prefixo" style={{ gap: 12 }}>
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">Enunciado do questionário (prefixo)</span>
          <p className="muted small">Aparece antes de todas as perguntas de nota de “{nomeQ}”. Leia cada pergunta junto com ele.</p>
        </div>
      </div>
      {grupos.map(([t, ms]) => {
        const orig = prefixoOriginal(qid, ms[0])
        const mudou = ms.some((m) => linhaPrefixo(prefixos, qid, m) && prefixoDe(prefixos, qid, m) !== prefixoOriginal(qid, m))
        return (
          <div key={t + ms.join()} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="px-selos">
              {ms.map((m) => <span key={m} className="selo cinza">{MOD_CURTO[m]}</span>)}
              {mudou && <span className="selo azul">alterado na proposta</span>}
            </div>
            <p className="pref-txt">{t || <span className="muted small">Sem enunciado (as perguntas aparecem sozinhas).</span>}</p>
            {mudou && orig && <p className="small">Hoje: <del>{orig}</del></p>}
            {exemplo && t && <p className="small muted">Exemplo: “{comPrefixo(t, exemplo.texto)}”</p>}
            {editavel && !editando && <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => abrir(t, ms)}>Editar enunciado{grupos.length > 1 ? ' de ' + ms.map((m) => MOD_CURTO[m]).join(', ') : ''}</button>}
          </div>
        )
      })}
      {editando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line-2)', paddingTop: 12 }}>
          <label className="small" style={{ fontWeight: 600 }} htmlFor={'pref-' + qid}>Novo enunciado</label>
          <textarea id={'pref-' + qid} className="input" rows={2} style={{ height: 'auto', padding: 12, fontSize: 15 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="px-sugestoes">
            <span className="small muted">Sugestões (um clique para usar, depois ajuste se quiser):</span>
            {sugestoesPrefixo(qid).map((s) => (
              <button key={s} type="button" onClick={() => setTexto(s)}>{s}</button>
            ))}
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Vale para</legend>
            {mods.map((m) => (
              <label key={m} className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={alvo.includes(m)} onChange={(e) => setAlvo(e.target.checked ? MODALIDADES.filter((x) => [...alvo, m].includes(x)) : alvo.filter((x) => x !== m))} />
                {MOD_CURTO[m]}
              </label>
            ))}
          </fieldset>
          {exemplo && texto.trim() && <p className="px-leitura"><span className="pref">{texto.trim()}</span> {exemplo.texto}</p>}
          <div className="filtros">
            <button className="btn sm escuro" disabled={ocupado || !alvo.length} onClick={salvar}>Salvar enunciado</button>
            <button className="btn sm" onClick={() => setEditando(false)}>Cancelar</button>
            {prefixoOriginal(qid, alvo[0] || mods[0]) && texto !== prefixoOriginal(qid, alvo[0] || mods[0]) && (
              <button className="btn sm" onClick={() => setTexto(prefixoOriginal(qid, alvo[0] || mods[0]))}>Voltar ao enunciado de hoje</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
