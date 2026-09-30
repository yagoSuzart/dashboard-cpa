// Resumo das mudanças da proposta: visão rápida para a Pró-Reitoria (e para a CPA revisar antes de enviar).
import { useState } from 'react'
import {
  ATUAL_POR_ID, MODALIDADES, MOD_CURTO, BANCO_POR_ID, resumoMudancas, modalidadesMudaram, escalaMudou, escalaOriginal,
  nomeEscala, prefixoOriginal, motivoDe, salvarPrefixo, registrar, MARCA_PR_VOLTA, marcar, adaptadaDe,
} from '../lib/proxima.js'
import { SelosEixoDim } from './ProximaSelos.jsx'

const GRUPOS = [
  ['reescritas', 'Reescritas'],
  ['novas', 'Novas'],
  ['retiradas', 'Retiradas'],
  ['prefixos', 'Prefixos alterados'],
  ['formato', 'Modalidade / escala'],
  ['mantidas', 'Mantidas'],
]

export default function ProximaResumo({ ctx, titulo }) {
  const { dados, modo } = ctx
  const r = resumoMudancas(dados.itens, dados.prefixos)
  const [verMantidas, setVerMantidas] = useState(false)
  const nomeQ = Object.fromEntries(dados.questionarios.map((q) => [q.id, q.nome]))
  const decidiveis = [...r.reescritas, ...r.novas, ...r.formato.filter((i) => i.texto === i.texto_original)]
  const decididas = decidiveis.filter((i) => i.decisao_pr).length
  const ir = (k) => {
    if (k === 'mantidas') setVerMantidas(true)
    setTimeout(() => document.getElementById('px-g-' + k)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  return (
    <div className="coluna">
      <section className="card" style={{ gap: 14 }}>
        <div className="card-h">
          <div className="t">
            <span className="eyebrow">{titulo}</span>
            <h2>Resumo das mudanças</h2>
            <p className="muted small">O que muda em relação ao instrumento de hoje (2026.1). Clique num número para ir à lista.</p>
          </div>
          <div className="spacer" />
          {modo === 'pr' && <span className={'selo ' + (decididas === decidiveis.length ? 'verde' : 'laranja')}>{decididas} de {decidiveis.length} mudanças decididas</span>}
        </div>
        <div className="px-contadores">
          {GRUPOS.map(([k, t]) => (
            <button key={k} type="button" className={'px-cont ' + k} onClick={() => ir(k)}>
              <span className="q">{r[k].length}</span>
              <span className="t">{t}</span>
            </button>
          ))}
        </div>
      </section>

      <Grupo id="reescritas" titulo="Reescritas" n={r.reescritas.length} vazio="Nenhuma pergunta reescrita.">
        {r.reescritas.map((it) => (
          <Mudanca key={it.id} ctx={ctx} item={it} nomeQ={nomeQ}>
            <div className="px-antes-depois">
              <span className="seta">Antes</span>
              <del>{it.texto_original}</del>
              <span className="seta">Depois</span>
              <ins>{it.texto}</ins>
            </div>
          </Mudanca>
        ))}
      </Grupo>

      <Grupo id="novas" titulo="Novas" n={r.novas.length} vazio="Nenhuma pergunta nova.">
        {r.novas.map((it) => (
          <Mudanca key={it.id} ctx={ctx} item={it} nomeQ={nomeQ} extra={<span className="selo verde">{it.origem === 'banco' ? 'do banco de perguntas' : adaptadaDe(it) ? 'adaptada de outra modalidade' : 'escrita pela ' + (it.adicionada_pr ? 'Pró-Reitoria' : 'CPA')}</span>}>
            <div className="px-antes-depois">
              <ins>{it.texto}</ins>
              {it.origem === 'banco' && it.texto_original && it.texto !== it.texto_original && <span className="small muted">Texto proposto no banco: <del>{it.texto_original}</del></span>}
              {it.banco_id && BANCO_POR_ID[it.banco_id]?.observacao && <span className="small muted">Por que foi proposta: {BANCO_POR_ID[it.banco_id].observacao}</span>}
              {adaptadaDe(it) && <span className="small muted">{adaptadaDe(it)}</span>}
            </div>
          </Mudanca>
        ))}
      </Grupo>

      <Grupo id="retiradas" titulo="Retiradas" n={r.retiradas.length} vazio="Nenhuma pergunta retirada.">
        {r.retiradas.map((it) => (
          <Mudanca key={it.id} ctx={ctx} item={it} nomeQ={nomeQ} retirada>
            <div className="px-antes-depois">
              <del>{it.texto}</del>
              <span className="small"><b>Motivo:</b> {motivoDe(it) || 'não informado'}</span>
            </div>
          </Mudanca>
        ))}
      </Grupo>

      <Grupo id="prefixos" titulo="Prefixos alterados" n={r.prefixos.length} vazio="Nenhum enunciado alterado.">
        {r.prefixos.map((p) => <PrefixoMudado key={p.id || p.questionario_id + p.modalidade} ctx={ctx} p={p} nomeQ={nomeQ} />)}
      </Grupo>

      <Grupo id="formato" titulo="Mudanças de modalidade e escala" n={r.formato.length} vazio="Nenhuma mudança de modalidade ou escala.">
        {r.formato.map((it) => {
          const a = ATUAL_POR_ID[it.atual_id]
          return (
            <Mudanca key={it.id} ctx={ctx} item={it} nomeQ={nomeQ} semEditar={it.texto !== it.texto_original}>
              <p style={{ fontWeight: 600 }}>{it.texto}</p>
              {modalidadesMudaram(it) && (
                <div className="px-antes-depois">
                  <span className="small"><b>Modalidades:</b> <del>{MODALIDADES.filter((m) => a.modalidades.includes(m)).map((m) => MOD_CURTO[m]).join(', ')}</del> → <ins>{MODALIDADES.filter((m) => it.modalidades.includes(m)).map((m) => MOD_CURTO[m]).join(', ')}</ins></span>
                </div>
              )}
              {escalaMudou(it) && (
                <div className="px-antes-depois">
                  <span className="small"><b>Escala:</b> <del>{[...new Set(it.modalidades.map((m) => nomeEscala(escalaOriginal(it, m))))].join(' / ')}</del> → <ins>{nomeEscala(it.escala)}</ins></span>
                </div>
              )}
            </Mudanca>
          )
        })}
      </Grupo>

      <Grupo id="mantidas" titulo="Mantidas (sem mudança de texto)" n={r.mantidas.length} vazio="Nenhuma.">
        {verMantidas ? (
          <div className="px-mud">
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              {r.mantidas.map((it) => <li key={it.id}>{it.texto} <span className="small muted">· {nomeQ[it.questionario_id] || 'A definir'}{it.decisao_pr === 'reprovada' ? ' · reprovada pela Pró-Reitoria' : ''}</span></li>)}
            </ol>
          </div>
        ) : (
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setVerMantidas(true)}>Ver as {r.mantidas.length} perguntas mantidas</button>
        )}
      </Grupo>
    </div>
  )
}

function Grupo({ id, titulo, n, vazio, children }) {
  return (
    <section className="card px-grupo" id={'px-g-' + id} style={{ gap: 12 }}>
      <h3>{titulo} <span className="selo cinza">{n}</span></h3>
      {n ? children : <p className="small muted">{vazio}</p>}
    </section>
  )
}

function Mudanca({ ctx, item, nomeQ, children, extra, retirada, semEditar }) {
  const { modo, salvarIt } = ctx
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(item.texto)
  const [ocupado, setOcupado] = useState(false)
  const pr = modo === 'pr'
  const podeEditarTexto = !retirada && !semEditar && modo !== 'leitura'
  const fazer = async (patch, acao) => {
    setOcupado(true)
    await salvarIt(item, patch, acao, { texto: patch.texto || item.texto })
    setOcupado(false)
  }
  const cls = item.decisao_pr === 'aprovada' ? ' aprovada' : item.decisao_pr === 'reprovada' ? ' reprovada' : ''
  return (
    <div className={'px-mud' + cls}>
      <div className="px-selos">
        <span className="selo cinza">{nomeQ[item.questionario_id] || 'A definir'}</span>
        <SelosEixoDim eixo={item.eixo} dimensao={item.dimensao} />
        {extra}
        {item.editada_pr && <span className="selo azul">editada pela Pró-Reitoria</span>}
        {item.decisao_pr === 'aprovada' && <span className="selo verde">{retirada ? 'retirada confirmada pela Pró-Reitoria' : 'aprovada pela Pró-Reitoria'}</span>}
        {item.decisao_pr === 'reprovada' && <span className="selo laranja">reprovada pela Pró-Reitoria</span>}
      </div>
      {editando ? (
        <>
          <label className="sr-only" htmlFor={'rs-' + item.id}>Texto da pergunta</label>
          <textarea id={'rs-' + item.id} className="input" rows={3} style={{ height: 'auto', padding: 12, fontSize: 15 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="filtros">
            <button className="btn sm escuro" disabled={ocupado || !texto.trim()} onClick={async () => { await fazer({ texto: texto.trim(), ...(pr ? { editada_pr: true } : {}) }, 'reescreveu a pergunta'); setEditando(false) }}>Salvar texto</button>
            {pr && <button className="btn sm" disabled={ocupado || !texto.trim()} onClick={async () => { await fazer({ texto: texto.trim(), editada_pr: true, decisao_pr: 'aprovada' }, 'editou e aprovou a pergunta'); setEditando(false) }}>Salvar e aprovar</button>}
            <button className="btn sm" onClick={() => { setTexto(item.texto); setEditando(false) }}>Cancelar</button>
          </div>
        </>
      ) : (
        children
      )}
      {(pr || podeEditarTexto) && !editando && (
        <div className="filtros" style={{ gap: 8 }}>
          {pr && !retirada && (
            <>
              <button className={'btn sm' + (item.decisao_pr === 'aprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => fazer({ decisao_pr: item.decisao_pr === 'aprovada' ? null : 'aprovada' }, 'aprovou a pergunta')}>Aprovar</button>
              <button className={'btn sm' + (item.decisao_pr === 'reprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => fazer({ decisao_pr: item.decisao_pr === 'reprovada' ? null : 'reprovada' }, 'reprovou a pergunta')}>Reprovar</button>
            </>
          )}
          {pr && retirada && (
            <>
              <button className={'btn sm' + (item.decisao_pr === 'aprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => fazer({ decisao_pr: item.decisao_pr === 'aprovada' ? null : 'aprovada' }, 'concordou com a retirada')}>Concordo com a retirada</button>
              <button className="btn sm" disabled={ocupado} onClick={() => fazer({ incluida: true, decisao_pr: null, observacao: marcar(MARCA_PR_VOLTA, motivoDe(item)) }, 'trouxe a pergunta de volta')}>Manter a pergunta</button>
            </>
          )}
          {podeEditarTexto && <button className="btn sm" onClick={() => setEditando(true)}>Editar texto</button>}
        </div>
      )}
    </div>
  )
}

function PrefixoMudado({ ctx, p, nomeQ }) {
  const { perfil, dados, modo, setDados, setAviso } = ctx
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(p.texto || '')
  const antes = p.texto_original ?? prefixoOriginal(p.questionario_id, p.modalidade)
  const salvar = async () => {
    try {
      const novo = await salvarPrefixo(dados.proposta.id, dados.prefixos, p.questionario_id, p.modalidade, texto.trim(), perfil.id)
      setDados((d) => ({ ...d, prefixos: [...d.prefixos.filter((x) => !(x.questionario_id === p.questionario_id && x.modalidade === p.modalidade)), novo] }))
      registrar(dados.proposta.id, perfil.id, 'alterou o prefixo', { texto: texto.trim(), antes: p.texto, questionario: nomeQ[p.questionario_id], modalidades: [p.modalidade] })
      setEditando(false)
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível salvar o enunciado: ' + (e.message || e) })
    }
  }
  return (
    <div className="px-mud">
      <div className="px-selos">
        <span className="selo cinza">{nomeQ[p.questionario_id] || p.questionario_id}</span>
        <span className="selo cinza">{MOD_CURTO[p.modalidade]}</span>
      </div>
      {editando ? (
        <>
          <label className="sr-only" htmlFor={'rp-' + p.questionario_id + p.modalidade}>Enunciado</label>
          <textarea id={'rp-' + p.questionario_id + p.modalidade} className="input" rows={2} style={{ height: 'auto', padding: 12, fontSize: 15 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="filtros">
            <button className="btn sm escuro" onClick={salvar}>Salvar enunciado</button>
            <button className="btn sm" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </>
      ) : (
        <div className="px-antes-depois">
          <span className="seta">Antes</span>
          <del>{antes || '(sem enunciado)'}</del>
          <span className="seta">Depois</span>
          <ins>{p.texto || '(sem enunciado)'}</ins>
        </div>
      )}
      {modo !== 'leitura' && !editando && <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setEditando(true)}>Editar enunciado</button>}
    </div>
  )
}
