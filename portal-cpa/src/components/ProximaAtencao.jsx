// Painel "Precisa de atenção" da montagem: (a) dimensões sem pergunta, (b) candidatas à retirada, (c) retiradas para decidir.
import { useState } from 'react'
import {
  BANCO, DIMS, EIXO_DA_DIM, MODALIDADES, MOD_CURTO, ESCALAS, cobertura, entra, fmtPct, ehInfra, modsDoQuestionario,
  LIMITE_NAO_UTILIZO, LIMITE_POUCAS, MIN_RESPOSTAS, MARCA_MANTIDA, MARCA_RETIRADA, MARCA_CONFIRMADA, marcar, motivoDe,
  retiradaConfirmada, tipoDaEscala, gruposPrefixo, textoParaPrefixo,
} from '../lib/proxima.js'
import { fmtInt } from '../lib/cpa.js'
import { SelosEixoDim } from './ProximaSelos.jsx'

const TIPOS_MOTIVO = {
  nao_utilizo: `“Não sei / Não utilizo” ≥ ${Math.round(LIMITE_NAO_UTILIZO * 100)}%`,
  infra_ead: 'Infraestrutura no EAD/Semi',
  poucas: 'Poucas respostas',
  duplicada: 'Texto parecido em outro questionário',
}

export default function ProximaAtencao({ ctx, onNova }) {
  const { dados, candidatas, res } = ctx
  const cob = cobertura(dados.itens)
  const faltam = Object.keys(DIMS).map(Number).filter((d) => !cob[d])
  const pend = candidatas.filter((c) => !c.analisada)
  const retiradas = dados.itens.filter((i) => !i.incluida)
  const aDecidir = retiradas.filter((i) => !retiradaConfirmada(i))
  const [bloco, setBloco] = useState(faltam.length ? 'a' : pend.length ? 'b' : 'c')

  return (
    <section className="card px-atencao" id="px-atencao" aria-labelledby="px-atencao-t">
      <div className="card-h">
        <div className="t">
          <span className="eyebrow" style={{ color: 'var(--ember)' }}>Antes de enviar</span>
          <h2 id="px-atencao-t">Precisa de atenção</h2>
          <p className="muted small">Sugestões para a CPA decidir. Nada muda sem um clique de vocês.{res ? ` Números da pesquisa ${res.ciclo} importada.` : ''}</p>
        </div>
      </div>
      <div className="px-blocos" role="group" aria-label="Blocos que precisam de atenção">
        <button type="button" className={'px-bloco ' + (faltam.length ? 'alerta' : 'ok')} aria-pressed={bloco === 'a'} onClick={() => setBloco('a')}>
          <span className="q">{faltam.length}</span>
          <span className="t">Dimensões sem pergunta</span>
          <span className="d">{faltam.length ? faltam.map((d) => 'D' + d).join(', ') + ' · com perguntas propostas prontas para acrescentar' : 'Todas as 10 dimensões têm pergunta.'}</span>
        </button>
        <button type="button" className={'px-bloco ' + (pend.length ? 'alerta' : 'ok')} aria-pressed={bloco === 'b'} onClick={() => setBloco('b')}>
          <span className="q">{pend.length}</span>
          <span className="t">Candidatas à retirada</span>
          <span className="d">{pend.length ? `perguntas sugeridas para revisão ainda não analisadas (de ${candidatas.length})` : candidatas.length ? 'Todas as sugestões já foram analisadas.' : 'Nenhuma sugestão.'}</span>
        </button>
        <button type="button" className={'px-bloco ' + (aDecidir.length ? 'alerta' : '')} aria-pressed={bloco === 'c'} onClick={() => setBloco('c')}>
          <span className="q">{retiradas.length}</span>
          <span className="t">Retiradas — decidir</span>
          <span className="d">{aDecidir.length ? `${aDecidir.length} para decidir: excluir de vez ou trazer de volta` : retiradas.length ? 'Todas decididas.' : 'Nenhuma pergunta retirada.'}</span>
        </button>
      </div>
      {bloco === 'a' && <BlocoDimensoes ctx={ctx} faltam={faltam} onNova={onNova} />}
      {bloco === 'b' && <BlocoCandidatas ctx={ctx} />}
      {bloco === 'c' && <BlocoRetiradas ctx={ctx} retiradas={retiradas} />}
    </section>
  )
}

/* ---------- (a) dimensões sem pergunta ---------- */
function BlocoDimensoes({ ctx, faltam, onNova }) {
  const { dados, modo } = ctx
  if (!faltam.length) return <div className="aviso ok">Todas as dimensões do SINAES têm ao menos uma pergunta de nota.</div>
  const usados = new Set(dados.itens.map((i) => i.banco_id).filter(Boolean))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {faltam.map((d) => {
        const props = BANCO.filter((b) => b.dimensao === d)
        return (
          <div key={d} className="px-dim-falta">
            <div className="px-selos">
              <SelosEixoDim eixo={EIXO_DA_DIM[d]} dimensao={d} />
              <span className="selo laranja">nenhuma pergunta de nota</span>
            </div>
            {props.length ? (
              <>
                <p className="small muted">{props.length} {props.length === 1 ? 'pergunta proposta' : 'perguntas propostas'} do banco para esta dimensão. Ajuste o texto, escolha onde entra e acrescente.</p>
                {props.map((b) => (usados.has(b.id) ? (
                  <div key={b.id} className="px-linha"><p className="txt">{b.texto}</p><span className="selo verde" style={{ alignSelf: 'flex-start' }}>já na proposta (retirada ou sem nota)</span></div>
                ) : (
                  <PropostaEditavel key={b.id} ctx={ctx} b={b} />
                )))}
              </>
            ) : (
              <p className="small muted">Não há pergunta proposta no banco para esta dimensão.</p>
            )}
            {modo !== 'leitura' && (
              <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => onNova(d)}>Escrever uma nova para D{d}</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function questionarioSugerido(dados, dim) {
  const eixo = EIXO_DA_DIM[dim]
  const conta = {}
  for (const i of dados.itens) if (i.questionario_id && entra(i) && i.eixo === eixo) conta[i.questionario_id] = (conta[i.questionario_id] || 0) + 1
  const melhor = Object.entries(conta).sort((a, b) => b[1] - a[1])[0]?.[0]
  return melhor || dados.questionarios.find((q) => q.id === 'politicas_academicas')?.id || dados.questionarios[0]?.id || ''
}

function PropostaEditavel({ ctx, b }) {
  const { dados, modo, criarIt } = ctx
  const qIni = questionarioSugerido(dados, b.dimensao)
  const modsIni = modsDoQuestionario(dados.itens, qIni)
  const [f, setF] = useState({ texto: b.texto, q: qIni, mods: modsIni.length ? modsIni : [...MODALIDADES], escala: 'likert_5' })
  const [ocupado, setOcupado] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const editavel = modo !== 'leitura'
  const id = 'pe-' + b.id
  // A pergunta como o aluno vai ler, com o prefixo do questionário escolhido em cada modalidade
  const leituras = f.escala === 'aberta' || !f.q ? [] : gruposPrefixo(dados.prefixos, f.q, f.mods).filter(([t]) => t)
  const adaptada = textoParaPrefixo(f.texto)
  const acrescentar = async () => {
    setOcupado(true)
    const pos = Math.max(0, ...dados.itens.filter((i) => (i.questionario_id || '') === f.q).map((i) => i.posicao || 0)) + 1
    await criarIt(
      {
        proposta_id: dados.proposta.id, origem: 'banco', banco_id: b.id, questionario_id: f.q || null, posicao: pos,
        texto: f.texto.trim(), texto_original: b.texto, tipo: tipoDaEscala(f.escala, 'nota_1a5'), opcoes: b.opcoes, escala: f.escala,
        modalidades: f.mods, eixo: EIXO_DA_DIM[b.dimensao], dimensao: b.dimensao, incluida: true, adicionada_pr: modo === 'pr',
      },
      'acrescentou uma pergunta proposta',
      { texto: f.texto.trim(), fonte: b.fonte, dimensao: b.dimensao },
    )
    setOcupado(false)
  }
  return (
    <div className="px-linha">
      <label className="sr-only" htmlFor={id + '-t'}>Texto da pergunta proposta</label>
      <textarea id={id + '-t'} className="input" rows={2} style={{ height: 'auto', padding: 10, fontSize: 15, fontWeight: 600 }} value={f.texto} disabled={!editavel} onChange={(e) => set('texto', e.target.value)} />
      {b.observacao && <span className="small muted">Por que foi proposta: {b.observacao}</span>}
      {leituras.map(([t, ms]) => (
        <p key={t} className="px-leitura">
          <span className="mods">Como o aluno vai ler{leituras.length > 1 ? ' · ' + ms.map((m) => MOD_CURTO[m]).join(', ') : ''}</span>
          <span className="pref">{t}</span> {f.texto}
        </p>
      ))}
      {f.escala !== 'aberta' && !f.q && <span className="small muted">Escolha o questionário para ver a pergunta junto com o prefixo dele.</span>}
      {leituras.length > 0 && adaptada && adaptada !== f.texto && (
        <div className="aviso" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="small">Esta pergunta está escrita como pergunta completa e, depois do prefixo, pode ficar repetida. Sugestão para combinar com o prefixo:</span>
          <b className="small">“{adaptada}”</b>
          {editavel && <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('texto', adaptada)}>Usar esta versão</button>}
        </div>
      )}
      {editavel && (
        <div className="filtros" style={{ gap: 8 }}>
          <label className="sr-only" htmlFor={id + '-q'}>Questionário</label>
          <select id={id + '-q'} className="input" style={{ height: 36, fontSize: 13 }} value={f.q} onChange={(e) => { const q = e.target.value; const ms = modsDoQuestionario(dados.itens, q); setF((x) => ({ ...x, q, mods: ms.length ? ms : x.mods })) }}>
            <option value="">Questionário a definir</option>
            {dados.questionarios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
          <div className="seg" role="group" aria-label="Modalidades">
            {MODALIDADES.map((m) => (
              <button key={m} type="button" aria-pressed={f.mods.includes(m)} onClick={() => set('mods', f.mods.includes(m) ? f.mods.filter((x) => x !== m) : MODALIDADES.filter((x) => [...f.mods, m].includes(x)))}>{MOD_CURTO[m]}</button>
            ))}
          </div>
          <label className="sr-only" htmlFor={id + '-e'}>Escala</label>
          <select id={id + '-e'} className="input" style={{ height: 36, fontSize: 13 }} value={f.escala} onChange={(e) => set('escala', e.target.value)}>
            {Object.entries(ESCALAS).map(([k, e]) => <option key={k} value={k}>Escala: {e.t}</option>)}
          </select>
          <button className="btn sm escuro" disabled={ocupado || !f.texto.trim() || !f.mods.length} onClick={acrescentar}>Acrescentar</button>
        </div>
      )}
    </div>
  )
}

/* ---------- (b) candidatas à retirada ---------- */
function BlocoCandidatas({ ctx }) {
  const { candidatas, res, dados } = ctx
  const [filtro, setFiltro] = useState('')
  const [verAnalisadas, setVerAnalisadas] = useState(false)
  const [limite, setLimite] = useState(8)
  const conta = {}
  for (const c of candidatas) if (!c.analisada) for (const t of new Set(c.motivos.map((m) => m.tipo))) conta[t] = (conta[t] || 0) + 1
  const lista = candidatas.filter((c) => (verAnalisadas || !c.analisada) && (!filtro || c.motivos.some((m) => m.tipo === filtro)))
  const nomeQ = Object.fromEntries(dados.questionarios.map((q) => [q.id, q.nome]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="aviso">
        <span>
          <b>Sugestão para a CPA decidir.</b> Critérios, com os números da pesquisa {res?.ciclo || 'importada'}: “Não sei / Não utilizo” a partir de {Math.round(LIMITE_NAO_UTILIZO * 100)}% numa modalidade;
          perguntas de Infraestrutura abertas para EAD ou Semipresencial; menos de {Math.round(LIMITE_POUCAS * 100)}% (ou menos de {MIN_RESPOSTAS}) dos alunos daquela modalidade que responderam a Satisfação Geral; e textos muito parecidos em questionários diferentes.
          “Manter” registra que a pergunta foi analisada.
        </span>
      </div>
      {!res && <div className="aviso erro">Sem planilha importada: só dá para sugerir pelo tipo de pergunta e pelo texto.</div>}
      {res?.infra?.n > 0 && (
        <div className="px-infra">
          <span>Na pesquisa {res.ciclo}, o questionário de Infraestrutura recebeu <b>{fmtInt(res.infra.n)} notas de alunos EAD e Semipresencial</b> e <b>{fmtInt(res.infra.nu)} “Não utilizo”</b> ({fmtPct(res.infra.nu / (res.infra.n + res.infra.nu))}). O aluno EAD normalmente não utiliza a estrutura física.</span>
        </div>
      )}
      <div className="filtros">
        <div className="chips">
          <button className="chip-btn" aria-pressed={!filtro} onClick={() => setFiltro('')}>Todas · {candidatas.filter((c) => !c.analisada).length}</button>
          {Object.entries(TIPOS_MOTIVO).map(([k, t]) => (conta[k] ? <button key={k} className="chip-btn" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{t} · {conta[k]}</button> : null))}
        </div>
        <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={verAnalisadas} onChange={(e) => setVerAnalisadas(e.target.checked)} /> Mostrar as já analisadas ({candidatas.filter((c) => c.analisada).length})
        </label>
      </div>
      {!lista.length && <div className="aviso ok">Nenhuma sugestão pendente neste filtro.</div>}
      {lista.slice(0, limite).map((c) => <Candidata key={c.item.id} ctx={ctx} c={c} nomeQ={nomeQ} />)}
      {lista.length > limite && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setLimite((l) => l + 20)}>Mostrar mais ({lista.length - limite})</button>}
    </div>
  )
}

function Candidata({ ctx, c, nomeQ }) {
  const { res, modo, salvarIt } = ctx
  const { item, motivos, analisada } = c
  const [detalhe, setDetalhe] = useState(false)
  const [manter, setManter] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const editavel = modo === 'cpa'
  const g = item.atual_id && res ? res.porId[item.atual_id] : null
  const infra = motivos.find((m) => m.tipo === 'infra_ead')
  const resumo = [...new Set(motivos.map((m) => TIPOS_MOTIVO[m.tipo]))].join('; ')
  const fazer = async (patch, acao, det) => {
    setOcupado(true)
    await salvarIt(item, patch, acao, det)
    setOcupado(false)
  }
  return (
    <div className={'px-linha' + (analisada ? ' analisada' : '')}>
      <div className="px-selos">
        <span className="selo cinza">{nomeQ[item.questionario_id] || 'A definir'}</span>
        <SelosEixoDim eixo={item.eixo} dimensao={item.dimensao} />
        {item.modalidades.map((m) => <span key={m} className="selo cinza">{MOD_CURTO[m]}</span>)}
        {analisada && <span className="selo verde">analisada: mantida</span>}
      </div>
      <p className="txt">{item.texto}</p>
      <ul className="px-motivos">
        {motivos.map((m, i) => <li key={i} className={m.tipo}>{m.t}</li>)}
      </ul>
      {analisada && motivoDe(item) && <span className="small muted">Motivo registrado: {motivoDe(item)}</span>}
      {detalhe && (
        <div className="rolagem">
          {g ? (
            <table className="px-tab-num">
              <thead><tr><th>Modalidade</th><th>Notas</th><th>Não sei / Não utilizo</th><th>% não utilizo</th><th>Alunos (Satisfação Geral)</th></tr></thead>
              <tbody>
                {MODALIDADES.map((m) => {
                  const x = g[m] || { n: 0, nu: 0 }
                  const p = x.n + x.nu ? x.nu / (x.n + x.nu) : 0
                  return (
                    <tr key={m}>
                      <td>{MOD_CURTO[m]}{item.modalidades.includes(m) ? '' : ' (não habilitada)'}</td>
                      <td>{fmtInt(x.n)}</td>
                      <td>{fmtInt(x.nu)}</td>
                      <td className={p >= LIMITE_NAO_UTILIZO ? 'alto' : ''}>{fmtPct(p)}</td>
                      <td>{fmtInt(res.ref[m] || 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="small muted">Sem números da planilha para esta pergunta{item.tipo === 'aberta' ? ' (pergunta aberta)' : ''}.</p>
          )}
        </div>
      )}
      {manter && (
        <div className="filtros">
          <label className="sr-only" htmlFor={'mt-' + item.id}>Por que manter</label>
          <input id={'mt-' + item.id} className="input" style={{ flex: 1, minWidth: 200, height: 38, fontSize: 14 }} placeholder="Por que manter? (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <button className="btn sm escuro" disabled={ocupado} onClick={async () => { await fazer({ observacao: marcar(MARCA_MANTIDA, motivo) }, 'manteve a pergunta após análise', { texto: item.texto, motivo: motivo.trim() || null }); setManter(false) }}>Confirmar: manter</button>
          <button className="btn sm" onClick={() => setManter(false)}>Cancelar</button>
        </div>
      )}
      <div className="filtros" style={{ gap: 8 }}>
        {editavel && !manter && (
          <>
            <button className="btn sm escuro" disabled={ocupado} onClick={() => fazer({ incluida: false, observacao: marcar(MARCA_RETIRADA, resumo) }, 'retirou a pergunta', { texto: item.texto, motivo: resumo })}>Retirar</button>
            {!analisada && <button className="btn sm" disabled={ocupado} onClick={() => setManter(true)}>Manter</button>}
            {infra && ehInfra(item) && infra.mods.map((m) => (
              item.modalidades.length > 1 && (
                <button key={m} className="btn sm" disabled={ocupado} onClick={() => fazer({ modalidades: item.modalidades.filter((x) => x !== m) }, 'mudou as modalidades', { texto: item.texto, tirou: m })}>Tirar {MOD_CURTO[m]} desta pergunta</button>
              )
            ))}
          </>
        )}
        <button className="btn sm" onClick={() => setDetalhe((v) => !v)}>{detalhe ? 'Esconder detalhes' : 'Ver detalhes'}</button>
      </div>
    </div>
  )
}

/* ---------- (c) retiradas para decidir ---------- */
function BlocoRetiradas({ ctx, retiradas }) {
  const { dados } = ctx
  const nomeQ = Object.fromEntries(dados.questionarios.map((q) => [q.id, q.nome]))
  if (!retiradas.length) return <div className="aviso ok">Nenhuma pergunta retirada até agora.</div>
  const ordem = [...retiradas].sort((a, b) => Number(retiradaConfirmada(a)) - Number(retiradaConfirmada(b)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="small muted">Perguntas do instrumento de hoje não são apagadas: ao confirmar, ficam registradas como retiradas para a Pró-Reitoria ver. Perguntas novas ou do banco podem ser excluídas de vez.</p>
      {ordem.map((it) => <Retirada key={it.id} ctx={ctx} item={it} nomeQ={nomeQ} />)}
    </div>
  )
}

function Retirada({ ctx, item, nomeQ }) {
  const { modo, salvarIt, excluirIt, nomes } = ctx
  const [motivo, setMotivo] = useState(motivoDe(item))
  const [ocupado, setOcupado] = useState(false)
  const conf = retiradaConfirmada(item)
  const editavel = modo === 'cpa'
  const fazer = async (fn) => {
    setOcupado(true)
    await fn()
    setOcupado(false)
  }
  return (
    <div className={'px-linha' + (conf ? ' analisada' : '')}>
      <div className="px-selos">
        <span className="selo cinza">{nomeQ[item.questionario_id] || 'A definir'}</span>
        <SelosEixoDim eixo={item.eixo} dimensao={item.dimensao} />
        <span className={'selo ' + (conf ? 'cinza' : 'laranja')}>{conf ? 'retirada confirmada' : 'retirada — decidir'}</span>
        {item.origem !== 'atual' && <span className="selo verde">{item.origem === 'banco' ? 'do banco' : 'nova'}</span>}
      </div>
      <p className="txt" style={{ textDecoration: 'line-through', textDecorationColor: 'var(--ember)' }}>{item.texto}</p>
      {editavel ? (
        <div className="campo">
          <label htmlFor={'mo-' + item.id} className="small">Motivo / observação</label>
          <input id={'mo-' + item.id} className="input" style={{ height: 38, fontSize: 14 }} value={motivo} placeholder="Por que sai?" onChange={(e) => setMotivo(e.target.value)} />
        </div>
      ) : (
        motivoDe(item) && <span className="small">Motivo: {motivoDe(item)}</span>
      )}
      {item.atualizado_por && <span className="small muted">Retirada por {nomes[item.atualizado_por] || '—'} · {new Date(item.atualizado_em).toLocaleString('pt-BR')}</span>}
      {editavel && (
        <div className="filtros" style={{ gap: 8 }}>
          <button className="btn sm escuro" disabled={ocupado} onClick={() => fazer(() => salvarIt(item, { incluida: true, observacao: null }, 'trouxe a pergunta de volta', { texto: item.texto }))}>Trazer de volta</button>
          {item.origem === 'atual' ? (
            <button className="btn sm" disabled={ocupado} onClick={() => fazer(() => salvarIt(item, { observacao: marcar(MARCA_CONFIRMADA, motivo) }, 'confirmou a retirada', { texto: item.texto, motivo: motivo.trim() || null }))}>{conf ? 'Salvar motivo' : 'Confirmar a retirada'}</button>
          ) : (
            <button className="btn sm" disabled={ocupado} onClick={() => fazer(() => excluirIt(item))}>Excluir de vez</button>
          )}
          {!conf && motivo !== motivoDe(item) && (
            <button className="btn sm" disabled={ocupado} onClick={() => fazer(() => salvarIt(item, { observacao: marcar(MARCA_RETIRADA, motivo) }, 'registrou o motivo da retirada', { texto: item.texto, motivo: motivo.trim() }))}>Salvar motivo</button>
          )}
        </div>
      )}
    </div>
  )
}
