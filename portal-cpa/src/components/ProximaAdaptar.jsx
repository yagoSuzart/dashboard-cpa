// "Adaptar para outra modalidade": leva perguntas de um questionário para uma modalidade que hoje não
// as responde (ex.: Docente do Presencial para o Semipresencial, que também tem aulas presenciais),
// com um texto próprio, mais genérico e direto. Cada uma entra na proposta como pergunta nova,
// guardando de onde veio, e segue para a Pró-Reitoria como as demais.
import { useState } from 'react'
import { MARCA_ADAPTADA, MODALIDADES, MOD_CURTO, criarItem, escalaDoItem, prefixoDe, registrar, salvarPrefixo, textoNaModalidade } from '../lib/proxima.js'

export default function ProximaAdaptar({ ctx, itens, preMarcadas = true, onFechar }) {
  const { perfil, dados, modo, setDados, setAviso } = ctx
  const faltam = MODALIDADES.filter((m) => !itens.every((i) => i.modalidades.includes(m)))
  const [alvo, setAlvo] = useState(faltam.includes('SEMIPRESENCIAL') ? 'SEMIPRESENCIAL' : faltam[0] || '')
  const [linhas, setLinhas] = useState(() => itens.map((i) => ({ item: i, marcada: preMarcadas, texto: textoNaModalidade(i, i.modalidades[0]) })))
  const [ocupado, setOcupado] = useState(false)
  const nomeQ = (qid) => dados.questionarios.find((x) => x.id === qid)?.nome || 'Questionário a definir'
  const marcadas = linhas.filter((l) => l.marcada && !l.item.modalidades.includes(alvo))
  const muda = (k, patch) => setLinhas((ls) => ls.map((l, i) => (i === k ? { ...l, ...patch } : l)))

  const salvar = async () => {
    setOcupado(true)
    try {
      let pos = Math.max(0, ...dados.itens.map((i) => i.posicao || 0)) + 1
      let prefixos = [...dados.prefixos]
      const criados = []
      for (const l of marcadas) {
        const it = l.item
        const origem = it.modalidades.map((m) => MOD_CURTO[m]).join(', ')
        const novo = await criarItem({
          proposta_id: dados.proposta.id, origem: 'nova', questionario_id: it.questionario_id, posicao: pos++,
          texto: l.texto.trim(), texto_original: null, tipo: it.tipo, opcoes: it.opcoes || null,
          escala: escalaDoItem(it, it.modalidades[0]) || null, modalidades: [alvo], eixo: it.eixo, dimensao: it.dimensao,
          incluida: true, adicionada_pr: modo === 'pr',
          observacao: `${MARCA_ADAPTADA}: “${textoNaModalidade(it, it.modalidades[0])}” (${nomeQ(it.questionario_id)} · ${origem})`,
        }, perfil.id)
        criados.push(novo)
        registrar(dados.proposta.id, perfil.id, 'adaptou uma pergunta para ' + MOD_CURTO[alvo], { texto: novo.texto, de: it.texto }, novo.id)
        // Se o questionário ainda não tem enunciado nesta modalidade, usa o mesmo da modalidade de origem
        const qid = it.questionario_id
        if (qid && !prefixoDe(prefixos, qid, alvo)) {
          const base = prefixoDe(prefixos, qid, it.modalidades[0])
          if (base) {
            const p = await salvarPrefixo(dados.proposta.id, prefixos, qid, alvo, base, perfil.id)
            prefixos = [...prefixos.filter((r) => !(r.questionario_id === qid && r.modalidade === alvo)), p]
          }
        }
      }
      setDados((d) => ({ ...d, itens: [...d.itens, ...criados], prefixos }))
      setAviso({ tipo: 'ok', txt: `${criados.length} ${criados.length === 1 ? 'pergunta adaptada' : 'perguntas adaptadas'} para ${MOD_CURTO[alvo]}. Elas entram como novas e vão para a Pró-Reitoria junto com a proposta.` })
      onFechar()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível adaptar: ' + (e.message || e) })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="ad-t" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" style={{ maxWidth: 820 }}>
        <h2 id="ad-t">Adaptar para outra modalidade</h2>
        <p className="muted small">A pergunta de hoje continua como está. Aqui você cria uma versão com texto próprio para a modalidade escolhida; ela entra como pergunta nova, com a origem registrada.</p>
        {!faltam.length ? (
          <p>Estas perguntas já são respondidas por todas as modalidades.</p>
        ) : (
          <>
            <div className="campo">
              <label htmlFor="ad-alvo">Levar para</label>
              <div className="seg" role="group" id="ad-alvo" aria-label="Modalidade de destino">
                {faltam.map((m) => <button key={m} type="button" aria-pressed={alvo === m} onClick={() => setAlvo(m)}>{MOD_CURTO[m]}</button>)}
              </div>
            </div>
            <div className="px-adapt-lista">
              {linhas.map((l, k) => {
                const ja = l.item.modalidades.includes(alvo)
                return (
                  <div key={l.item.id} className={'px-adapt' + (l.marcada && !ja ? ' on' : '')}>
                    <label className="px-adapt-cab">
                      <input type="checkbox" disabled={ja} checked={l.marcada && !ja} onChange={(e) => muda(k, { marcada: e.target.checked })} />
                      <span><b>{l.item.posicao ?? '—'}.</b> Hoje ({l.item.modalidades.map((m) => MOD_CURTO[m]).join(', ')}): {textoNaModalidade(l.item, l.item.modalidades[0])}</span>
                    </label>
                    {ja ? (
                      <span className="small muted">Já é respondida no {MOD_CURTO[alvo]}.</span>
                    ) : l.marcada && (
                      <>
                        <label className="sr-only" htmlFor={'ad-tx-' + l.item.id}>Texto para {MOD_CURTO[alvo]}</label>
                        <textarea id={'ad-tx-' + l.item.id} className="input" rows={2} style={{ height: 'auto', padding: 10, fontSize: 14 }} value={l.texto} onChange={(e) => muda(k, { texto: e.target.value })} />
                        <span className="small muted">Texto que o aluno do {MOD_CURTO[alvo]} vai ler (edite para ficar mais genérico e direto).</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        <div className="filtros">
          <button className="btn escuro" disabled={ocupado || !marcadas.length || marcadas.some((l) => !l.texto.trim())} onClick={salvar}>
            {ocupado ? 'Salvando…' : `Adaptar ${marcadas.length} ${marcadas.length === 1 ? 'pergunta' : 'perguntas'}${alvo ? ' para ' + MOD_CURTO[alvo] : ''}`}
          </button>
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          {linhas.length > 1 && (
            <>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn sm" onClick={() => setLinhas((ls) => ls.map((l) => ({ ...l, marcada: true })))}>Marcar todas</button>
              <button type="button" className="btn sm" onClick={() => setLinhas((ls) => ls.map((l) => ({ ...l, marcada: false })))}>Desmarcar todas</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
