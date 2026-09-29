// "Perguntas atuais": as perguntas do instrumento de hoje numa folha só, para editar, manter ou retirar
// sem rolar a montagem inteira. O detalhe completo (dimensão, escala, modalidades, posição) abre na própria linha.
import { useState } from 'react'
import {
  DECISOES, MODALIDADES, MOD_CURTO, MARCA_MANTIDA, atuaisDe, decisaoDe, fmtPct, motivoDe,
} from '../lib/proxima.js'
import { Vazio } from './ui.jsx'

const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function ProximaAtuais({ ctx, Detalhe }) {
  const { dados, modo } = ctx
  const atuais = atuaisDe(dados.itens)
  const [q, setQ] = useState('')
  const [dec, setDec] = useState('')
  const [mod, setMod] = useState('')
  const [busca, setBusca] = useState('')
  const [lote, setLote] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  const cont = Object.fromEntries(Object.keys(DECISOES).map((k) => [k, atuais.filter((i) => decisaoDe(i) === k).length]))
  const ordemQ = Object.fromEntries(dados.questionarios.map((x, i) => [x.id, i]))
  const lista = atuais
    .filter((i) => !q || i.questionario_id === q)
    .filter((i) => !dec || decisaoDe(i) === dec)
    .filter((i) => !mod || i.modalidades.includes(mod))
    .filter((i) => !busca.trim() || norm(i.texto + ' ' + i.texto_original).includes(norm(busca.trim())))
    .sort((a, b) => (ordemQ[a.questionario_id] ?? 99) - (ordemQ[b.questionario_id] ?? 99) || (a.posicao ?? 999) - (b.posicao ?? 999))
  const aDecidirVisiveis = lista.filter((i) => decisaoDe(i) === 'decidir')

  const manterTodas = async () => {
    setOcupado(true)
    for (const it of aDecidirVisiveis) await ctx.salvarIt(it, { observacao: MARCA_MANTIDA }, 'manteve a pergunta após análise', { texto: it.texto })
    setOcupado(false)
    setLote(false)
  }

  return (
    <section className="card px-atuais" aria-labelledby="px-atuais-t">
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">Instrumento de hoje</span>
          <h2 id="px-atuais-t">Perguntas atuais ({atuais.length})</h2>
          <p className="muted small">Só as perguntas de hoje, separadas das novas. Para cada uma: manter como está, editar o texto ou retirar.</p>
        </div>
      </div>

      <div className="px-dec" role="group" aria-label="Filtrar por decisão">
        <button type="button" aria-pressed={dec === ''} onClick={() => setDec('')}><b>{atuais.length}</b> Todas</button>
        {Object.entries(DECISOES).map(([k, d]) => (
          <button key={k} type="button" className={d.c} aria-pressed={dec === k} onClick={() => setDec(dec === k ? '' : k)}><b>{cont[k]}</b> {d.t}{k === 'retirada' || k === 'decidir' ? '' : 's'}</button>
        ))}
      </div>

      <div className="filtros">
        <label className="sr-only" htmlFor="px-at-q">Questionário</label>
        <select id="px-at-q" className="input" style={{ height: 38, fontSize: 14 }} value={q} onChange={(e) => setQ(e.target.value)}>
          <option value="">Todos os questionários</option>
          {dados.questionarios.filter((x) => atuais.some((i) => i.questionario_id === x.id)).map((x) => (
            <option key={x.id} value={x.id}>{x.nome} · {atuais.filter((i) => i.questionario_id === x.id).length}</option>
          ))}
        </select>
        <div className="seg" role="group" aria-label="Modalidade">
          {[['', 'Todas'], ...MODALIDADES.map((m) => [m, MOD_CURTO[m]])].map(([k, t]) => (
            <button key={k} aria-pressed={mod === k} onClick={() => setMod(k)}>{t}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="px-at-busca">Buscar no texto</label>
        <input id="px-at-busca" className="input" style={{ height: 38, fontSize: 14, flex: '1 1 200px' }} placeholder="Buscar no texto da pergunta" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {modo === 'cpa' && aDecidirVisiveis.length > 0 && (
        <div className="filtros" style={{ gap: 8 }}>
          {!lote ? (
            <button className="btn sm" onClick={() => setLote(true)}>Manter as {aDecidirVisiveis.length} que faltam decidir{q || mod || busca ? ' (desta seleção)' : ''}</button>
          ) : (
            <>
              <span className="small">Marcar {aDecidirVisiveis.length} {aDecidirVisiveis.length === 1 ? 'pergunta' : 'perguntas'} como mantidas, sem mudar o texto?</span>
              <button className="btn sm escuro" disabled={ocupado} onClick={manterTodas}>{ocupado ? 'Salvando…' : 'Confirmar'}</button>
              <button className="btn sm" disabled={ocupado} onClick={() => setLote(false)}>Cancelar</button>
            </>
          )}
        </div>
      )}

      {!lista.length && <Vazio>Nenhuma pergunta atual com esses filtros.</Vazio>}
      {lista.map((it) => <Cartao key={it.id} ctx={ctx} item={it} Detalhe={Detalhe} mod={mod} vizinhos={vizinhosDe(dados.itens, it)} />)}
    </section>
  )
}

// Vizinhos no mesmo questionário (para as setas ↑ ↓ do detalhe)
function vizinhosDe(itens, it) {
  const mesmos = itens.filter((i) => (i.questionario_id || '') === (it.questionario_id || '')).sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
  const k = mesmos.findIndex((i) => i.id === it.id)
  return [mesmos[k - 1], mesmos[k + 1]]
}

// Faixa com a decisão sobre a pergunta de hoje + o mesmo cartão da montagem (editar, retirar, dimensão, escala…)
function Cartao({ ctx, item, Detalhe, mod, vizinhos }) {
  const { dados, modo, res, salvarIt } = ctx
  const [ocupado, setOcupado] = useState(false)
  const d = decisaoDe(item)
  const nomeQ = dados.questionarios.find((x) => x.id === item.questionario_id)?.nome
  const g = item.atual_id && res ? res.porId[item.atual_id] : null
  let nu = null
  if (g) {
    const t = Object.values(g).reduce((s, x) => ({ n: s.n + x.n, nu: s.nu + x.nu }), { n: 0, nu: 0 })
    if (t.n + t.nu) nu = t.nu / (t.n + t.nu)
  }
  return (
    <div className={'px-atual ' + d}>
      <div className="px-atual-faixa">
        <span className={'selo ' + DECISOES[d].c}>{DECISOES[d].t}</span>
        <span className="small"><b>{nomeQ || 'Questionário a definir'}</b></span>
        {nu != null && <span className={'small' + (nu >= 0.3 ? ' px-nu-alto' : ' muted')}>“Não sei / Não utilizo” na última CPA: {fmtPct(nu)}</span>}
        {(d === 'retirada' || d === 'mantida') && motivoDe(item) && <span className="small muted">Motivo: {motivoDe(item)}</span>}
        <span style={{ flex: 1 }} />
        {modo === 'cpa' && d === 'decidir' && (
          <button className="btn sm escuro" disabled={ocupado} onClick={async () => { setOcupado(true); await salvarIt(item, { observacao: MARCA_MANTIDA }, 'manteve a pergunta após análise', { texto: item.texto }); setOcupado(false) }}>Manter como está</button>
        )}
        {modo === 'cpa' && d === 'mantida' && (
          <button className="btn sm" disabled={ocupado} onClick={async () => { setOcupado(true); await salvarIt(item, { observacao: null }, 'voltou a pergunta para decidir', { texto: item.texto }); setOcupado(false) }}>Desfazer “manter”</button>
        )}
      </div>
      <Detalhe ctx={ctx} item={item} mod={mod} vizinhos={vizinhos} semSituacao />
    </div>
  )
}
