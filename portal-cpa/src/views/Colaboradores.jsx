// CPA do corpo docente e do corpo técnico-administrativo, dentro do Portal.
// Só Gestor(a) Técnico(a), Coordenação da CPA e Pró-Reitoria veem (o banco também garante isso).
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GERE_COLAB, MIN_GRUPO, PUBLICOS, atualizarCampanha, carregarRespostas, instrumentoDe,
  comentarioDoBloco, criarCampanha, csvRespostas, linkDaCampanha, listarCampanhas, mediaDeGrupo, perguntasFechadas, resumoPergunta,
} from '../lib/colaboradores.js'
import { fmtInt, fmtNota, textoComentario } from '../lib/cpa.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'
import ColabEditor from '../components/ColabEditor.jsx'
import './colaboradores.css'

export default function Colaboradores({ perfil }) {
  const [campanhas, setCampanhas] = useState(null)
  const [erro, setErro] = useState(null)
  const [aba, setAba] = useState('resultados')
  const [selId, setSelId] = useState('')
  const gere = GERE_COLAB.includes(perfil.role)

  const recarregar = useCallback(() => listarCampanhas().then((l) => {
    setCampanhas(l)
    setSelId((s) => s || l[0]?.id || '')
  }).catch(setErro), [])
  useEffect(() => {
    recarregar()
  }, [recarregar])

  if (erro) return <Erro erro={erro} />
  if (!campanhas) return <Carregando texto="Abrindo a CPA dos colaboradores…" />
  const sel = campanhas.find((c) => c.id === selId)

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">CPA · corpo docente e técnico-administrativo</div>
          <h1>A avaliação de quem faz a UniFECAF.</h1>
          <p className="muted">Link público e anônimo, fora do ambiente do aluno. Os resultados ficam só aqui, para a Coordenação da CPA, a Pró-Reitoria e a gestão técnica.</p>
        </div>
      </section>
      <div className="seg" role="tablist" aria-label="Seções">
        {[['resultados', 'Resultados'], ['questionario', 'Questionário'], ['link', 'Link e período']].map(([k, t]) => (
          <button key={k} role="tab" aria-pressed={aba === k} onClick={() => setAba(k)}>{t}</button>
        ))}
      </div>
      {campanhas.length > 1 && (
        <div className="filtros">
          <label className="small" htmlFor="cb-camp" style={{ fontWeight: 700 }}>Período</label>
          <select id="cb-camp" className="input" style={{ height: 38, fontSize: 14, maxWidth: 420 }} value={selId} onChange={(e) => setSelId(e.target.value)}>
            {campanhas.map((c) => <option key={c.id} value={c.id}>{c.titulo} · {c.ciclo}{c.aberta ? ' (aberta)' : ''}</option>)}
          </select>
        </div>
      )}
      {aba === 'resultados' && (sel ? <Resultados key={sel.id} camp={sel} /> : <SemCampanha gere={gere} onIr={() => setAba('link')} />)}
      {aba === 'questionario' && (sel
        ? <ColabEditor key={sel.id} camp={sel} perfil={perfil} gere={gere} onSalvo={(c) => setCampanhas((l) => l.map((x) => (x.id === c.id ? c : x)))} />
        : <SemCampanha gere={gere} onIr={() => setAba('link')} />)}
      {aba === 'link' && <Links campanhas={campanhas} perfil={perfil} gere={gere} onMudou={recarregar} onSel={setSelId} />}
    </>
  )
}

function SemCampanha({ gere, onIr }) {
  return (
    <div className="card" style={{ alignItems: 'flex-start' }}>
      <h2>Ainda não há um período aberto.</h2>
      <p className="muted">{gere ? 'Crie o período em “Link e período” para gerar o link que vai para os professores e para o corpo técnico-administrativo.' : 'A Coordenação da CPA abre o período e gera o link.'}</p>
      {gere && <button className="btn escuro" onClick={onIr}>Criar o período</button>}
    </div>
  )
}

/* ---------------- resultados ---------------- */
function Resultados({ camp }) {
  const [resp, setResp] = useState(null)
  const [erro, setErro] = useState(null)
  const [pub, setPub] = useState('')
  const [verComent, setVerComent] = useState('')

  useEffect(() => {
    let vivo = true
    carregarRespostas(camp.id).then((r) => vivo && setResp(r)).catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [camp.id])

  const lista = useMemo(() => (resp || []).filter((r) => !pub || r.publico === pub), [resp, pub])
  if (erro) return <Erro erro={erro} />
  if (!resp) return <Carregando texto="Carregando as respostas…" />

  const nDoc = resp.filter((r) => r.publico === 'docente').length
  const nTec = resp.filter((r) => r.publico === 'tecnico').length
  const inst = instrumentoDe(camp)
  const fech = perguntasFechadas(inst, pub || undefined)
  const nps = resumoPergunta(lista, inst.final.nps.id, true)
  const geral = mediaDeGrupo(lista, fech.filter((p) => p.escala === 'satisfacao'))

  const baixar = () => {
    const url = URL.createObjectURL(new Blob([csvRespostas(inst, lista)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cpa-colaboradores-${camp.ciclo}${pub ? '-' + pub : ''}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <div className="filtros">
        <div className="seg" role="group" aria-label="Público">
          {[['', 'Todos'], ['docente', 'Docentes'], ['tecnico', 'Técnico-administrativos']].map(([k, t]) => (
            <button key={k} aria-pressed={pub === k} onClick={() => setPub(k)}>{t}</button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        {lista.length > 0 && <button className="btn sm" onClick={baixar}>Baixar respostas (CSV, anônimo)</button>}
      </div>

      <section className="cb-kpis">
        <div className="card kpi"><span className="v">{fmtInt(resp.length)}</span><span className="l">respostas no total</span></div>
        <div className="card kpi"><span className="v">{fmtInt(nDoc)}</span><span className="l">{PUBLICOS.docente.t}</span></div>
        <div className="card kpi"><span className="v">{fmtInt(nTec)}</span><span className="l">{PUBLICOS.tecnico.t}</span></div>
        <div className="card kpi"><span className="v">{fmtNota(nps.media, 1)}</span><span className="l">Satisfação geral (0 a 10){pub ? ' · ' + PUBLICOS[pub].curto : ''}</span></div>
        <div className="card kpi"><span className="v">{fmtNota(geral)}</span><span className="l">Média das perguntas de satisfação (1 a 5)</span></div>
      </section>

      {!lista.length ? (
        <Vazio>Ainda não chegou nenhuma resposta{pub ? ' deste público' : ''}.</Vazio>
      ) : (
        <>
          {lista.length < MIN_GRUPO && <div className="aviso">Ainda são {lista.length} {lista.length === 1 ? 'resposta' : 'respostas'}. Com menos de {MIN_GRUPO}, os números mudam muito e a pessoa pode ser reconhecida: leia com cuidado.</div>}
          <PorEixo inst={inst} lista={lista} resp={resp} pub={pub} />
          {inst.blocos.map((b) => (
            <BlocoResultado key={b.id} inst={inst} bloco={b} lista={lista} pub={pub} />
          ))}
          <Comentarios inst={inst} lista={lista} filtro={verComent} setFiltro={setVerComent} />
        </>
      )}
    </>
  )
}

function PorEixo({ inst, lista, resp, pub }) {
  const doc = resp.filter((r) => r.publico === 'docente')
  const tec = resp.filter((r) => r.publico === 'tecnico')
  const comparar = !pub && doc.length >= MIN_GRUPO && tec.length >= MIN_GRUPO
  return (
    <section className="card">
      <div className="card-h"><div className="t"><h2>Por eixo</h2><p className="muted small">Média de 1 a 5, sem contar “Não sei / Não se aplica”.{comparar ? ' Ao lado, docentes e técnico-administrativos separados.' : ''}</p></div></div>
      <div className="cb-eixos">
        {inst.blocos.map((b) => {
          const perg = perguntasFechadas(inst, pub || undefined).filter((p) => p.bloco.id === b.id && p.escala === 'satisfacao')
          const v = mediaDeGrupo(lista, perg)
          return (
            <div key={b.id} className="cb-eixo">
              <span className="eyebrow">Eixo {b.eixo}</span>
              <b>{b.titulo}</b>
              <span className="num cb-grande">{fmtNota(v)}</span>
              {comparar && (
                <span className="small muted">
                  Docentes {fmtNota(mediaDeGrupo(doc, perguntasFechadas(inst, 'docente').filter((p) => p.bloco.id === b.id && p.escala === 'satisfacao')))} ·
                  Técnicos {fmtNota(mediaDeGrupo(tec, perguntasFechadas(inst, 'tecnico').filter((p) => p.bloco.id === b.id && p.escala === 'satisfacao')))}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Distrib({ dist, n }) {
  return (
    <div className="cb-dist" aria-label="Distribuição das respostas de 1 a 5">
      {[1, 2, 3, 4, 5].map((v) => {
        const q = dist[v] || 0
        return <span key={v} className={'d' + v} style={{ flexGrow: q || 0.0001 }} title={`${v}: ${q} (${n ? Math.round((q / n) * 100) : 0}%)`} />
      })}
    </div>
  )
}

function BlocoResultado({ inst, bloco, lista, pub }) {
  const perg = perguntasFechadas(inst, pub || undefined).filter((p) => p.bloco.id === bloco.id)
  return (
    <section className="card">
      <div className="card-h"><div className="t"><span className="eyebrow">Eixo {bloco.eixo}</span><h2>{bloco.titulo}</h2></div></div>
      <table className="cb-tabela">
        <thead><tr><th>Pergunta</th><th className="n">Média</th><th className="n">Respostas</th><th className="n">Não sei</th><th style={{ width: '22%' }}>Distribuição (1 a 5)</th></tr></thead>
        <tbody>
          {perg.map((p) => {
            const r = resumoPergunta(lista, p.id)
            return (
              <tr key={p.id}>
                <td>
                  {p.texto}
                  {p.p !== 'ambos' && <span className="selo cinza" style={{ marginLeft: 6 }}>só {PUBLICOS[p.p].curto.toLowerCase()}</span>}
                  {p.escala === 'conhecimento' && <span className="selo azul" style={{ marginLeft: 6 }}>conhecimento</span>}
                </td>
                <td className="n num cb-media">{fmtNota(r.media)}</td>
                <td className="n">{fmtInt(r.n)}</td>
                <td className="n">{fmtInt(r.na)}</td>
                <td>{r.n > 0 && <Distrib dist={r.dist} n={r.n} />}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function Comentarios({ inst, lista, filtro, setFiltro }) {
  const fontes = [...inst.blocos.map((b) => ({ id: comentarioDoBloco(b), t: 'Eixo ' + b.eixo + ' · ' + b.titulo })), ...inst.final.abertas.map((a) => ({ id: a.id, t: a.texto }))]
  const todos = []
  for (const r of lista) for (const f of fontes) if (r.abertas?.[f.id]) todos.push({ r, f, texto: r.abertas[f.id] })
  const vis = filtro ? todos.filter((x) => x.f.id === filtro) : todos
  return (
    <section className="card">
      <div className="card-h">
        <div className="t"><h2>Comentários ({fmtInt(todos.length)})</h2><p className="muted small">Texto exatamente como a pessoa escreveu.</p></div>
        <div className="spacer" />
        <label className="sr-only" htmlFor="cb-com">Filtrar comentários</label>
        <select id="cb-com" className="input" style={{ height: 38, fontSize: 14, maxWidth: 360, width: "100%", minWidth: 0 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas as perguntas abertas</option>
          {fontes.map((f) => <option key={f.id} value={f.id}>{f.t} ({todos.filter((x) => x.f.id === f.id).length})</option>)}
        </select>
      </div>
      {!vis.length && <Vazio>Nenhum comentário aqui ainda.</Vazio>}
      <ul className="cb-coment">
        {vis.map((x, i) => (
          <li key={x.r.id + x.f.id + i}>
            <p>{textoComentario(x.texto)}</p>
            <span className="small muted">{PUBLICOS[x.r.publico]?.t} · {x.f.t}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------------- link e período ---------------- */
function Links({ campanhas, perfil, gere, onMudou, onSel }) {
  const ano = new Date().getFullYear()
  const [f, setF] = useState({ titulo: `CPA ${ano} · Docentes e técnico-administrativos`, ciclo: `${ano}.${new Date().getMonth() < 6 ? 1 : 2}`, fecha: '', copiar: true })
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const criar = async () => {
    setOcupado(true)
    try {
      const base = f.copiar && campanhas[0] ? JSON.parse(JSON.stringify(instrumentoDe(campanhas[0]))) : undefined
      const c = await criarCampanha(f.titulo.trim(), f.ciclo.trim(), f.fecha, perfil.id, base)
      await onMudou()
      onSel(c.id)
      setMsg({ tipo: 'ok', txt: 'Período criado. Ele começa fechado: ajuste o questionário na aba “Questionário” e depois clique em “Abrir para respostas”.' })
    } catch (e) {
      setMsg({ tipo: 'erro', txt: e.message })
    } finally {
      setOcupado(false)
    }
  }
  const mudar = async (c, patch, txt) => {
    try {
      await atualizarCampanha(c.id, patch)
      await onMudou()
      setMsg({ tipo: 'ok', txt })
    } catch (e) {
      setMsg({ tipo: 'erro', txt: e.message })
    }
  }
  const copiar = async (c) => {
    try {
      await navigator.clipboard.writeText(linkDaCampanha(c))
      setMsg({ tipo: 'ok', txt: 'Link copiado.' })
    } catch {
      setMsg({ tipo: 'erro', txt: 'Não deu para copiar automaticamente. Selecione o link e copie.' })
    }
  }
  const convite = (c) =>
    `Olá! A Comissão Própria de Avaliação (CPA) da UniFECAF convida você, professor(a) ou colaborador(a) técnico-administrativo, a participar da autoavaliação institucional. É anônima e leva cerca de 10 minutos: ${linkDaCampanha(c)}`

  return (
    <>
      {msg && <div className={'aviso ' + msg.tipo} role="status">{msg.txt}</div>}
      {!campanhas.length && <Vazio>Nenhum período criado ainda.</Vazio>}
      {campanhas.map((c) => (
        <section key={c.id} className="card cb-camp">
          <div className="card-h">
            <div className="t">
              <span className="eyebrow">{c.ciclo}</span>
              <h2>{c.titulo}</h2>
            </div>
            <div className="spacer" />
            <span className={'selo ' + (c.aberta ? 'verde' : 'cinza')}>{c.aberta ? 'aberta para respostas' : 'fechada'}</span>
            {c.fecha_em && <span className="selo cinza">até {new Date(c.fecha_em + 'T12:00').toLocaleDateString('pt-BR')}</span>}
          </div>
          <div className="cb-link">
            <label className="sr-only" htmlFor={'lk-' + c.id}>Link</label>
            <input id={'lk-' + c.id} className="input" readOnly value={linkDaCampanha(c)} onFocus={(e) => e.target.select()} />
            <button className="btn sm" onClick={() => copiar(c)}>Copiar link</button>
            <a className="btn sm" href={'https://wa.me/?text=' + encodeURIComponent(convite(c))} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
          </div>
          <p className="small muted">O mesmo link serve para professores e técnico-administrativos: a primeira pergunta é “você é…”. Cada público vê só as perguntas dele.</p>
          {gere && (
            <div className="filtros">
              {c.aberta
                ? <button className="btn" onClick={() => mudar(c, { aberta: false }, 'Período fechado. O link passa a mostrar “avaliação fechada”.')}>Fechar para respostas</button>
                : <button className="btn escuro" onClick={() => mudar(c, { aberta: true }, 'Período aberto. Já pode mandar o link.')}>Abrir para respostas</button>}
              <label className="small" htmlFor={'fe-' + c.id}>Fecha automaticamente em</label>
              <input id={'fe-' + c.id} type="date" className="input" style={{ height: 36, fontSize: 13, width: 170 }} value={c.fecha_em || ''} onChange={(e) => mudar(c, { fecha_em: e.target.value || null }, 'Data de encerramento salva.')} />
            </div>
          )}
        </section>
      ))}
      {gere && (
        <section className="card">
          <h2>Novo período</h2>
          <div className="cb-form">
            <label htmlFor="nc-t"><span>Título</span><input id="nc-t" className="input" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
            <label htmlFor="nc-c"><span>Ciclo</span><input id="nc-c" className="input" value={f.ciclo} onChange={(e) => setF({ ...f, ciclo: e.target.value })} /></label>
            <label htmlFor="nc-f"><span>Fecha em (opcional)</span><input id="nc-f" type="date" className="input" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></label>
          </div>
          {campanhas.length > 0 && (
            <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={f.copiar} onChange={(e) => setF({ ...f, copiar: e.target.checked })} />
              Começar com o questionário de “{campanhas[0].titulo}” (desmarcado: questionário padrão)
            </label>
          )}
          <div><button className="btn escuro" disabled={ocupado || !f.titulo.trim() || !f.ciclo.trim()} onClick={criar}>Criar período (começa fechado)</button></div>
        </section>
      )}
    </>
  )
}
