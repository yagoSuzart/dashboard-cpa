// Editor do questionário da CPA de docentes e técnico-administrativos (como na Próxima CPA):
// editar texto, público e dimensão, reordenar, excluir e acrescentar perguntas, seções e abertas.
// Cada período tem o seu questionário; depois da primeira resposta ele fica travado (o banco também trava).
import { useEffect, useId, useState } from 'react'
import {
  ESCALAS_COLAB, INSTRUMENTO_PADRAO, PUBLICOS, TEXTO_COMENTARIO, contarRespostas, instrumentoDe, novoId, novoInstrumento,
  perguntasFechadas, salvarInstrumento,
} from '../lib/colaboradores.js'
import { DIMS, EIXOS } from '../lib/proxima.js'
import { leitura as lidoJunto, naoEncaixa } from '../lib/concordancia.js'
import { SelosEixoDim } from './ProximaSelos.jsx'

const copia = (x) => JSON.parse(JSON.stringify(x))
const PUB_OPCOES = [['ambos', 'Docentes e técnicos'], ['docente', 'Só docentes'], ['tecnico', 'Só técnico-administrativos']]
const PREFIXOS = ['Qual o seu grau de satisfação com:', 'Qual o seu nível de conhecimento sobre:']

export default function ColabEditor({ camp, perfil, gere, onSalvo, leitura = false }) {
  const [inst, setInst] = useState(() => copia(instrumentoDe(camp)))
  const [nResp, setNResp] = useState(null)
  const [ver, setVer] = useState('')
  const [msg, setMsg] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmaPadrao, setConfirmaPadrao] = useState(false)

  useEffect(() => {
    if (leitura) return
    let vivo = true
    contarRespostas(camp.id).then((n) => vivo && setNResp(n)).catch(() => vivo && setNResp(0))
    return () => {
      vivo = false
    }
  }, [camp.id, leitura])

  const travado = leitura || !gere || nResp == null || nResp > 0
  const salvar = async (novo, txt) => {
    const antes = inst
    setInst(novo)
    setSalvando(true)
    try {
      const c = await salvarInstrumento(camp.id, novo, perfil.id)
      onSalvo?.(c)
      setMsg({ tipo: 'ok', txt: txt || 'Questionário salvo.' })
    } catch (e) {
      setInst(antes)
      setMsg({ tipo: 'erro', txt: 'Não foi possível salvar: ' + (e.message || e) })
    } finally {
      setSalvando(false)
    }
  }
  // Aplica uma mudança numa cópia e salva
  const mudar = (fn, txt) => {
    const novo = copia(inst)
    fn(novo)
    salvar(novo, txt)
  }

  const nDoc = perguntasFechadas(inst, 'docente').length
  const nTec = perguntasFechadas(inst, 'tecnico').length
  const abertasTotal = inst.blocos.length + inst.final.abertas.length

  const baixar = () => {
    const linhas = [['Seção', 'Enunciado', 'Pergunta', 'Público', 'Eixo', 'Dimensão', 'Escala']]
    for (const b of inst.blocos) {
      for (const g of b.grupos) for (const p of g.perguntas) linhas.push([b.titulo, g.prefixo, p.texto, PUB_OPCOES.find(([k]) => k === p.p)?.[1], 'Eixo ' + b.eixo, p.dim ? 'D' + p.dim + ' · ' + DIMS[p.dim] : '', g.escala === 'conhecimento' ? '1 a 5 (conhecimento) + Prefiro não responder' : '1 a 5 + Não sei / Não se aplica'])
      linhas.push([b.titulo, '', TEXTO_COMENTARIO, 'Docentes e técnicos', '', '', 'Aberta (opcional)'])
    }
    linhas.push(['Para fechar', '', inst.final.nps.texto, 'Docentes e técnicos', '', '', '0 a 10'])
    for (const a of inst.final.abertas) linhas.push(['Para fechar', '', a.texto, 'Docentes e técnicos', '', '', 'Aberta (opcional)'])
    const esc = (v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
    const url = URL.createObjectURL(new Blob(['﻿' + linhas.map((l) => l.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `questionario-cpa-docentes-tecnicos-${camp.ciclo}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const visivel = (p) => !ver || p.p === 'ambos' || p.p === ver

  return (
    <>
      <div className="filtros">
        <div className="seg" role="group" aria-label="Mostrar perguntas de">
          {[['', 'Todas'], ['docente', 'Como o docente vê'], ['tecnico', 'Como o técnico vê']].map(([k, t]) => (
            <button key={k} aria-pressed={ver === k} onClick={() => setVer(k)}>{t}</button>
          ))}
        </div>
        <span className="small muted">Docentes: {nDoc} fechadas · Técnicos: {nTec} fechadas · + satisfação geral (0 a 10) e {abertasTotal} abertas (opcionais)</span>
        <span style={{ flex: 1 }} />
        <a className="btn sm" href={leitura ? '#/avaliar/previa' : '#/avaliar/previa.' + camp.codigo} target="_blank" rel="noreferrer">Ver como a pessoa responde ↗</a>
        <button className="btn sm" onClick={baixar}>Baixar para revisar (CSV)</button>
      </div>

      {nResp > 0 && <div className="aviso">Este período já tem {nResp} {nResp === 1 ? 'resposta' : 'respostas'}: o questionário ficou travado para não misturar resultados. Para mudar, crie um novo período em “Link e período”.</div>}
      {!gere && !leitura && <div className="aviso">Só a Coordenação da CPA edita o questionário. Aqui você vê a versão deste período.</div>}
      {!travado && <div className="aviso ok">Você pode editar à vontade enquanto ninguém respondeu. Cada mudança é salva na hora{salvando ? '… salvando' : '.'}</div>}
      {msg && <div className={'aviso ' + msg.tipo} role="status">{msg.txt}</div>}

      {inst.blocos.map((b, bi) => (
        <section key={b.id} className="card ce-bloco">
          <div className="card-h">
            <div className="t">
              <span className="eyebrow">Eixo {b.eixo} · seção {bi + 1}</span>
              <TextoEditavel valor={b.titulo} travado={travado} rotulo="Título da seção" grande onSalvar={(t) => mudar((n) => { n.blocos[bi].titulo = t }, 'Título da seção salvo.')} />
            </div>
            <div className="spacer" />
            {!travado && (
              <div className="filtros" style={{ gap: 6 }}>
                <label className="sr-only" htmlFor={'eixo-' + b.id}>Eixo</label>
                <select id={'eixo-' + b.id} className="input ce-sel" value={b.eixo} onChange={(e) => mudar((n) => { n.blocos[bi].eixo = Number(e.target.value) }, 'Eixo da seção salvo.')}>
                  {EIXOS.map((e) => <option key={e.n} value={e.n}>Eixo {e.n} · {e.nome}</option>)}
                </select>
                <button className="btn sm" aria-label="Subir seção" disabled={bi === 0} onClick={() => mudar((n) => { [n.blocos[bi - 1], n.blocos[bi]] = [n.blocos[bi], n.blocos[bi - 1]] })}>↑</button>
                <button className="btn sm" aria-label="Descer seção" disabled={bi === inst.blocos.length - 1} onClick={() => mudar((n) => { [n.blocos[bi + 1], n.blocos[bi]] = [n.blocos[bi], n.blocos[bi + 1]] })}>↓</button>
                <Excluir rotulo="Excluir seção" pergunta={`Excluir a seção “${b.titulo}” e as ${b.grupos.reduce((s, g) => s + g.perguntas.length, 0)} perguntas dela?`} onSim={() => mudar((n) => { n.blocos.splice(bi, 1) }, 'Seção excluída.')} />
              </div>
            )}
          </div>

          {b.grupos.map((g, gi) => (
            <div key={gi} className="ce-grupo">
              <div className="ce-grupo-cab">
                {g.subtitulo && <b>{g.subtitulo}</b>}
                <TextoEditavel valor={g.prefixo} travado={travado} rotulo="Enunciado (prefixo)" classe="cb-prefixo" sugestoes={PREFIXOS} onSalvar={(t) => mudar((n) => { n.blocos[bi].grupos[gi].prefixo = t }, 'Enunciado salvo.')} />
                <div className="filtros" style={{ gap: 8 }}>
                  <span className="small muted">Escala: 1 = {ESCALAS_COLAB[g.escala].ancoras[0]} · 5 = {ESCALAS_COLAB[g.escala].ancoras[1]} · “{ESCALAS_COLAB[g.escala].na}” fora da média</span>
                  {!travado && (
                    <>
                      <label className="sr-only" htmlFor={`esc-${b.id}-${gi}`}>Escala</label>
                      <select id={`esc-${b.id}-${gi}`} className="input ce-sel" value={g.escala} onChange={(e) => mudar((n) => { n.blocos[bi].grupos[gi].escala = e.target.value }, 'Escala salva.')}>
                        <option value="satisfacao">Satisfação (1 a 5)</option>
                        <option value="conhecimento">Conhecimento (1 a 5)</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
              <ol className="ce-lista">
                {g.perguntas.map((p, pi) => visivel(p) && (
                  <li key={p.id} className="ce-q">
                    <TextoEditavel valor={p.texto} travado={travado} rotulo="Texto da pergunta" onSalvar={(t) => mudar((n) => { n.blocos[bi].grupos[gi].perguntas[pi].texto = t }, 'Pergunta salva.')} />
                    <span className="small" style={{ color: 'var(--blue-ink)' }}>Lido junto: “{lidoJunto(g.prefixo, p.texto)}”</span>
                    <div className="chips" style={{ gap: 6 }}>
                      {naoEncaixa(g.prefixo, p.texto) && <span className="selo laranja">não encaixa no enunciado</span>}
                      <SelosEixoDim eixo={b.eixo} dimensao={p.dim} />
                      {p.p !== 'ambos' && <span className="selo cinza">só {PUBLICOS[p.p].curto.toLowerCase()}</span>}
                    </div>
                    {!travado && (
                      <div className="filtros ce-acoes">
                        <label className="sr-only" htmlFor={'pub-' + p.id}>Público</label>
                        <select id={'pub-' + p.id} className="input ce-sel" value={p.p} onChange={(e) => mudar((n) => { n.blocos[bi].grupos[gi].perguntas[pi].p = e.target.value }, 'Público salvo.')}>
                          {PUB_OPCOES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                        </select>
                        <SelDim id={'dim-' + p.id} valor={p.dim} onChange={(d) => mudar((n) => { n.blocos[bi].grupos[gi].perguntas[pi].dim = d }, 'Dimensão salva.')} />
                        <button className="btn sm" aria-label="Subir" disabled={pi === 0} onClick={() => mudar((n) => { const l = n.blocos[bi].grupos[gi].perguntas; [l[pi - 1], l[pi]] = [l[pi], l[pi - 1]] })}>↑</button>
                        <button className="btn sm" aria-label="Descer" disabled={pi === g.perguntas.length - 1} onClick={() => mudar((n) => { const l = n.blocos[bi].grupos[gi].perguntas; [l[pi + 1], l[pi]] = [l[pi], l[pi + 1]] })}>↓</button>
                        <Excluir rotulo="Excluir" pergunta="Excluir esta pergunta?" onSim={() => mudar((n) => { n.blocos[bi].grupos[gi].perguntas.splice(pi, 1) }, 'Pergunta excluída.')} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {!travado && <NovaPergunta dimInicial={g.perguntas[g.perguntas.length - 1]?.dim} onCriar={(np) => mudar((n) => { n.blocos[bi].grupos[gi].perguntas.push({ id: novoId(b.id), ...np }) }, 'Pergunta acrescentada.')} />}
            </div>
          ))}
          <p className="small"><b>Aberta (opcional):</b> {TEXTO_COMENTARIO}</p>
        </section>
      ))}

      {!travado && <NovaSecao onCriar={(titulo, eixo) => mudar((n) => { n.blocos.push({ id: novoId('s'), eixo, titulo, grupos: [{ prefixo: PREFIXOS[0], escala: 'satisfacao', perguntas: [] }] }) }, 'Seção criada. Agora acrescente as perguntas dela.')} />}

      <section className="card ce-bloco">
        <div className="card-h"><div className="t"><span className="eyebrow">Para fechar</span><h2>Satisfação geral e perguntas abertas</h2></div></div>
        <div className="ce-q">
          <TextoEditavel valor={inst.final.nps.texto} travado={travado} rotulo="Pergunta de 0 a 10" onSalvar={(t) => mudar((n) => { n.final.nps.texto = t }, 'Pergunta de satisfação geral salva.')} />
          <span className="small muted">Nota de 0 a 10 (obrigatória)</span>
        </div>
        <ol className="ce-lista">
          {inst.final.abertas.map((a, ai) => (
            <li key={a.id} className="ce-q">
              <TextoEditavel valor={a.texto} travado={travado} rotulo="Pergunta aberta" onSalvar={(t) => mudar((n) => { n.final.abertas[ai].texto = t }, 'Pergunta aberta salva.')} />
              <span className="small muted">Aberta (opcional)</span>
              {!travado && (
                <div className="filtros ce-acoes">
                  <button className="btn sm" aria-label="Subir" disabled={ai === 0} onClick={() => mudar((n) => { const l = n.final.abertas; [l[ai - 1], l[ai]] = [l[ai], l[ai - 1]] })}>↑</button>
                  <button className="btn sm" aria-label="Descer" disabled={ai === inst.final.abertas.length - 1} onClick={() => mudar((n) => { const l = n.final.abertas; [l[ai + 1], l[ai]] = [l[ai], l[ai + 1]] })}>↓</button>
                  <Excluir rotulo="Excluir" pergunta="Excluir esta pergunta aberta?" onSim={() => mudar((n) => { n.final.abertas.splice(ai, 1) }, 'Pergunta aberta excluída.')} />
                </div>
              )}
            </li>
          ))}
        </ol>
        {!travado && <NovaAberta onCriar={(texto) => mudar((n) => { n.final.abertas.push({ id: novoId('g'), texto }) }, 'Pergunta aberta acrescentada.')} />}
      </section>

      {!travado && (
        <div className="filtros">
          {!confirmaPadrao ? (
            <button className="btn sm" onClick={() => setConfirmaPadrao(true)}>Voltar ao questionário padrão</button>
          ) : (
            <>
              <span className="small">Desfazer todas as mudanças deste período e voltar às {perguntasFechadas(INSTRUMENTO_PADRAO).length} perguntas padrão?</span>
              <button className="btn sm escuro" onClick={() => { setConfirmaPadrao(false); salvar(novoInstrumento(), 'Questionário padrão restaurado.') }}>Sim, voltar ao padrão</button>
              <button className="btn sm" onClick={() => setConfirmaPadrao(false)}>Cancelar</button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function TextoEditavel({ valor, travado, rotulo, onSalvar, grande = false, classe = '', sugestoes }) {
  const [editando, setEditando] = useState(false)
  const [t, setT] = useState(valor)
  const id = useId()
  if (!editando)
    return (
      <div className="ce-txt">
        {grande ? <h2>{valor}</h2> : <p className={classe || 'ce-txt-p'}>{valor}</p>}
        {!travado && <button className="btn sm" onClick={() => { setT(valor); setEditando(true) }}>Editar</button>}
      </div>
    )
  return (
    <div className="ce-edit">
      <label className="sr-only" htmlFor={id}>{rotulo}</label>
      <textarea id={id} className="input" rows={2} value={t} onChange={(e) => setT(e.target.value)} autoFocus />
      <div className="filtros" style={{ gap: 6 }}>
        <button className="btn sm escuro" disabled={!t.trim()} onClick={() => { onSalvar(t.trim()); setEditando(false) }}>Salvar</button>
        <button className="btn sm" onClick={() => setEditando(false)}>Cancelar</button>
        {sugestoes?.filter((s) => s !== t).map((s) => <button key={s} className="btn sm" onClick={() => setT(s)}>Usar “{s}”</button>)}
      </div>
    </div>
  )
}

function Excluir({ rotulo, pergunta, onSim }) {
  const [c, setC] = useState(false)
  if (!c) return <button className="btn sm" onClick={() => setC(true)}>{rotulo}</button>
  return (
    <span className="ce-confirma">
      <span className="small">{pergunta}</span>
      <button className="btn sm escuro" onClick={() => { setC(false); onSim() }}>Sim, excluir</button>
      <button className="btn sm" onClick={() => setC(false)}>Não</button>
    </span>
  )
}

function SelDim({ id, valor, onChange }) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>Dimensão</label>
      <select id={id} className="input ce-sel" value={valor || ''} onChange={(e) => onChange(Number(e.target.value) || null)}>
        <option value="">Sem dimensão</option>
        {EIXOS.map((e) => (
          <optgroup key={e.n} label={`Eixo ${e.n} · ${e.nome}`}>
            {e.dims.map((d) => <option key={d} value={d}>D{d} · {DIMS[d]}</option>)}
          </optgroup>
        ))}
      </select>
    </>
  )
}

function NovaPergunta({ dimInicial, onCriar }) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState({ texto: '', p: 'ambos', dim: dimInicial || null })
  if (!aberto) return <div><button className="btn sm" onClick={() => { setF({ texto: '', p: 'ambos', dim: dimInicial || null }); setAberto(true) }}>+ Acrescentar pergunta aqui</button></div>
  return (
    <div className="ce-nova">
      <label className="small" htmlFor="ce-nova-t" style={{ fontWeight: 700 }}>Nova pergunta (vem depois do enunciado)</label>
      <textarea id="ce-nova-t" className="input" rows={2} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} placeholder="Ex.: O apoio da coordenação às aulas presenciais" autoFocus />
      <div className="filtros" style={{ gap: 6 }}>
        <label className="sr-only" htmlFor="ce-nova-p">Público</label>
        <select id="ce-nova-p" className="input ce-sel" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })}>
          {PUB_OPCOES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <SelDim id="ce-nova-d" valor={f.dim} onChange={(d) => setF({ ...f, dim: d })} />
        <button className="btn sm escuro" disabled={!f.texto.trim()} onClick={() => { onCriar({ texto: f.texto.trim(), p: f.p, dim: f.dim }); setAberto(false) }}>Acrescentar</button>
        <button className="btn sm" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </div>
  )
}

function NovaSecao({ onCriar }) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState({ titulo: '', eixo: 5 })
  if (!aberto) return <div><button className="btn" onClick={() => setAberto(true)}>+ Nova seção</button></div>
  return (
    <section className="card ce-nova">
      <h2>Nova seção</h2>
      <div className="filtros" style={{ gap: 8 }}>
        <label className="sr-only" htmlFor="ce-sec-t">Título</label>
        <input id="ce-sec-t" className="input" style={{ flex: '1 1 260px', height: 38 }} placeholder="Título da seção" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
        <label className="sr-only" htmlFor="ce-sec-e">Eixo</label>
        <select id="ce-sec-e" className="input ce-sel" value={f.eixo} onChange={(e) => setF({ ...f, eixo: Number(e.target.value) })}>
          {EIXOS.map((e) => <option key={e.n} value={e.n}>Eixo {e.n} · {e.nome}</option>)}
        </select>
        <button className="btn sm escuro" disabled={!f.titulo.trim()} onClick={() => { onCriar(f.titulo.trim(), f.eixo); setAberto(false); setF({ titulo: '', eixo: 5 }) }}>Criar seção</button>
        <button className="btn sm" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </section>
  )
}

function NovaAberta({ onCriar }) {
  const [aberto, setAberto] = useState(false)
  const [t, setT] = useState('')
  if (!aberto) return <div><button className="btn sm" onClick={() => setAberto(true)}>+ Acrescentar pergunta aberta</button></div>
  return (
    <div className="ce-nova">
      <label className="sr-only" htmlFor="ce-ab-t">Pergunta aberta</label>
      <textarea id="ce-ab-t" className="input" rows={2} value={t} onChange={(e) => setT(e.target.value)} placeholder="Ex.: Que sugestão você daria para a próxima avaliação?" autoFocus />
      <div className="filtros" style={{ gap: 6 }}>
        <button className="btn sm escuro" disabled={!t.trim()} onClick={() => { onCriar(t.trim()); setAberto(false); setT('') }}>Acrescentar</button>
        <button className="btn sm" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </div>
  )
}
