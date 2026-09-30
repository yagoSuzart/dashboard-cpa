// Página pública (sem login) da CPA para o corpo docente e o corpo técnico-administrativo.
// Anônima: não pede nome, e-mail nem matrícula. O rascunho fica só no aparelho de quem responde.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ESCALAS_COLAB, FINAL, NAO_SEI, PERFIL, PUBLICOS, blocosDo, campanhaPublica, comentarioDoBloco, enviarAvaliacao } from '../lib/colaboradores.js'
import './avaliar.css'

const ler = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null')
  } catch {
    return null
  }
}
const gravar = (k, v) => {
  try {
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* sem armazenamento: segue sem rascunho */
  }
}

const VAZIO = { publico: '', perfil: {}, notas: {}, abertas: {}, passo: 0 }

// "previa": a CPA vê exatamente o que a pessoa vê, sem gravar nada
const PREVIA = { titulo: 'Prévia · nada do que você marcar aqui é gravado', ciclo: '', aberta: true }

export default function AvaliarColaborador({ codigo }) {
  const previa = codigo === 'previa'
  const [camp, setCamp] = useState(previa ? PREVIA : undefined)
  const [erro, setErro] = useState(null)
  const chave = 'cpa-colab-' + codigo
  const chaveFim = 'cpa-colab-enviado-' + codigo
  const [r, setR] = useState(() => ({ ...VAZIO, ...(codigo === 'previa' ? {} : ler(chave) || {}) }))
  const [enviado, setEnviado] = useState(() => codigo !== 'previa' && !!ler(chaveFim))
  const [faltando, setFaltando] = useState([])
  const [ocupado, setOcupado] = useState(false)
  const topo = useRef(null)

  useEffect(() => {
    if (previa) return
    let vivo = true
    campanhaPublica(codigo).then((c) => vivo && setCamp(c)).catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [codigo, previa])
  useEffect(() => {
    if (!enviado && !previa) gravar(chave, r)
  }, [r, chave, enviado, previa])

  const blocos = useMemo(() => (r.publico ? blocosDo(r.publico) : []), [r.publico])
  const totalPassos = blocos.length + 2 // perfil + blocos + fechamento
  const irPara = (p) => {
    setFaltando([])
    setR((x) => ({ ...x, passo: p }))
    setTimeout(() => topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20)
  }
  const nota = (id, v) => {
    setFaltando((f) => f.filter((x) => x !== id))
    setR((x) => ({ ...x, notas: { ...x.notas, [id]: v } }))
  }
  const aberta = (id, v) => setR((x) => ({ ...x, abertas: { ...x.abertas, [id]: v } }))

  const avancar = () => {
    if (r.passo >= 1 && r.passo <= blocos.length) {
      const b = blocos[r.passo - 1]
      const faltam = b.grupos.flatMap((g) => g.perguntas).map((p) => p.id).filter((id) => r.notas[id] == null)
      if (faltam.length) {
        setFaltando(faltam)
        document.getElementById('q-' + faltam[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    irPara(r.passo + 1)
  }

  const enviar = async () => {
    if (r.notas[FINAL.nps.id] == null) {
      setFaltando([FINAL.nps.id])
      document.getElementById('q-' + FINAL.nps.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setOcupado(true)
    setErro(null)
    try {
      // Só as perguntas deste público e só os textos preenchidos
      const ids = new Set([...blocos.flatMap((b) => b.grupos.flatMap((g) => g.perguntas.map((p) => p.id))), FINAL.nps.id])
      const notas = Object.fromEntries(Object.entries(r.notas).filter(([k]) => ids.has(k)))
      const abertas = Object.fromEntries(Object.entries(r.abertas).map(([k, v]) => [k, String(v || '').trim().slice(0, 4000)]).filter(([, v]) => v))
      if (!previa) {
        await enviarAvaliacao(codigo, r.publico, r.perfil, notas, abertas)
        gravar(chave, null)
        gravar(chaveFim, { em: new Date().toISOString() })
      }
      setEnviado(true)
      topo.current?.scrollIntoView({ block: 'start' })
    } catch (e) {
      setErro(e)
    } finally {
      setOcupado(false)
    }
  }

  const casca = (conteudo) => (
    <div className="avl" ref={topo}>
      <header className="av-top">
        <img src="/logo-unifecaf-branco.png" alt="UniFECAF" />
        <div className="av-top-t">
          <b>Comissão Própria de Avaliação</b>
          <span>A voz da comunidade acadêmica.</span>
        </div>
      </header>
      <main className="av-main">{conteudo}</main>
      <footer className="av-rodape">CPA UniFECAF · respostas anônimas, analisadas somente em conjunto.</footer>
    </div>
  )

  if (camp === undefined && !erro) return casca(<p className="muted">Abrindo a avaliação…</p>)
  if (camp === null || (erro && camp === undefined))
    return casca(
      <section className="av-card">
        <h1>Link não encontrado.</h1>
        <p className="muted">Confira se o endereço está completo ou peça o link novamente à Comissão Própria de Avaliação.</p>
      </section>,
    )
  if (!camp.aberta)
    return casca(
      <section className="av-card">
        <span className="eyebrow">{camp.titulo}</span>
        <h1>Esta avaliação está fechada.</h1>
        <p className="muted">Obrigado pelo interesse. Quando um novo período for aberto, a CPA envia o link.</p>
      </section>,
    )
  if (enviado)
    return casca(
      <section className="av-card av-fim">
        <div className="av-check" aria-hidden="true">✓</div>
        <h1>Obrigado por participar!</h1>
        <p>Suas respostas foram enviadas de forma anônima. Elas ajudam a CPA e a gestão a planejar as melhorias da UniFECAF.</p>
        <button className="btn" onClick={() => { gravar(chaveFim, null); setR(VAZIO); setEnviado(false) }}>Outra pessoa vai responder neste aparelho</button>
      </section>,
    )

  const passo = r.passo
  const progresso = r.publico ? Math.round((passo / totalPassos) * 100) : 0

  return casca(
    <>
      {r.publico && (
        <div className="av-prog" aria-label={`Etapa ${passo + 1} de ${totalPassos + 1}`}>
          <div className="av-prog-barra"><span style={{ width: progresso + '%' }} /></div>
          <span className="small muted">Etapa {passo + 1} de {totalPassos + 1}</span>
        </div>
      )}

      {passo === 0 && (
        <section className="av-card">
          <span className="eyebrow">{camp.titulo}</span>
          <h1>Autoavaliação institucional</h1>
          <p>Esta pesquisa é <b>anônima</b>: não pedimos nome, e-mail nem matrícula. Leva cerca de 10 minutos. Responda pensando no seu dia a dia na UniFECAF.</p>
          <fieldset className="av-publico">
            <legend>Para começar, você é:</legend>
            {Object.entries(PUBLICOS).map(([k, p]) => (
              <button key={k} type="button" className="av-opcao" aria-pressed={r.publico === k} onClick={() => setR((x) => ({ ...x, publico: k, perfil: {} }))}>
                <b>{p.eu}</b>
                <span className="small muted">{p.t}</span>
              </button>
            ))}
          </fieldset>
          {r.publico && (
            <div className="av-perfil">
              <p className="small muted">Estas duas perguntas são opcionais e só servem para comparar grupos grandes. Grupos com menos de 5 respostas não aparecem nos resultados.</p>
              <Selecao rotulo={PERFIL.tempo.t} id="pf-tempo" opcoes={PERFIL.tempo.opcoes} valor={r.perfil.tempo} onChange={(v) => setR((x) => ({ ...x, perfil: { ...x.perfil, tempo: v } }))} />
              <Selecao rotulo={PERFIL[r.publico].t} id="pf-2" opcoes={PERFIL[r.publico].opcoes} valor={r.perfil[PERFIL[r.publico].campo]} onChange={(v) => setR((x) => ({ ...x, perfil: { ...x.perfil, [PERFIL[r.publico].campo]: v } }))} />
            </div>
          )}
          <div className="av-acoes">
            <span />
            <button className="btn escuro" disabled={!r.publico} onClick={() => irPara(1)}>Começar</button>
          </div>
        </section>
      )}

      {passo >= 1 && passo <= blocos.length && (() => {
        const b = blocos[passo - 1]
        return (
          <section className="av-card" aria-labelledby={'bl-' + b.id}>
            <span className="eyebrow">Eixo {b.eixo}</span>
            <h1 id={'bl-' + b.id}>{b.titulo}</h1>
            {b.grupos.map((g, gi) => (
              <div key={gi} className="av-grupo">
                {g.subtitulo && <h2>{g.subtitulo}</h2>}
                <p className="av-prefixo">{g.prefixo}</p>
                <Legenda escala={g.escala} />
                {g.perguntas.map((p) => (
                  <Pergunta key={p.id} p={p} escala={g.escala} valor={r.notas[p.id]} falta={faltando.includes(p.id)} onNota={(v) => nota(p.id, v)} />
                ))}
              </div>
            ))}
            <label className="av-coment" htmlFor={'c-' + b.id}>
              <span>Quer deixar um comentário, sugestão ou reclamação sobre {b.titulo.toLowerCase()}? <span className="muted">(opcional)</span></span>
              <textarea id={'c-' + b.id} className="input" rows={3} maxLength={4000} value={r.abertas[comentarioDoBloco(b)] || ''} onChange={(e) => aberta(comentarioDoBloco(b), e.target.value)} />
            </label>
            {faltando.length > 0 && <div className="aviso erro" role="alert">Faltou responder {faltando.length === 1 ? '1 pergunta' : faltando.length + ' perguntas'} (marcadas em laranja). Se não souber, use “{ESCALAS_COLAB[b.grupos[0].escala].na}”.</div>}
            <div className="av-acoes">
              <button className="btn" onClick={() => irPara(passo - 1)}>Voltar</button>
              <button className="btn escuro" onClick={avancar}>Continuar</button>
            </div>
          </section>
        )
      })()}

      {passo === blocos.length + 1 && (
        <section className="av-card" aria-labelledby="bl-final">
          <span className="eyebrow">Para fechar</span>
          <h1 id="bl-final">Satisfação geral</h1>
          <div id={'q-' + FINAL.nps.id} className={'av-q' + (faltando.includes(FINAL.nps.id) ? ' falta' : '')}>
            <p className="av-q-t">{FINAL.nps.texto}</p>
            <div className="av-escala nps" role="radiogroup" aria-label={FINAL.nps.texto}>
              {ESCALAS_COLAB.nps.valores.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={r.notas[FINAL.nps.id] === v} onClick={() => nota(FINAL.nps.id, v)}>{v}</button>
              ))}
            </div>
            <div className="av-ancoras"><span>0 · {ESCALAS_COLAB.nps.ancoras[0]}</span><span>10 · {ESCALAS_COLAB.nps.ancoras[1]}</span></div>
          </div>
          {FINAL.abertas.map((a) => (
            <label key={a.id} className="av-coment" htmlFor={'a-' + a.id}>
              <span>{a.texto} <span className="muted">(opcional)</span></span>
              <textarea id={'a-' + a.id} className="input" rows={4} maxLength={4000} value={r.abertas[a.id] || ''} onChange={(e) => aberta(a.id, e.target.value)} />
            </label>
          ))}
          {faltando.length > 0 && <div className="aviso erro" role="alert">Escolha uma nota de 0 a 10 para a satisfação geral.</div>}
          {erro && <div className="aviso erro" role="alert">Não foi possível enviar agora: {erro.message || String(erro)}. Suas respostas continuam salvas neste aparelho; tente de novo.</div>}
          <div className="av-acoes">
            <button className="btn" onClick={() => irPara(passo - 1)}>Voltar</button>
            <button className="btn escuro" disabled={ocupado} onClick={enviar}>{ocupado ? 'Enviando…' : 'Enviar minhas respostas'}</button>
          </div>
        </section>
      )}
    </>,
  )
}

function Selecao({ rotulo, id, opcoes, valor, onChange }) {
  return (
    <label className="av-sel" htmlFor={id}>
      <span>{rotulo}</span>
      <select id={id} className="input" value={valor || ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">Prefiro não informar</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function Legenda({ escala }) {
  const e = ESCALAS_COLAB[escala]
  return <div className="av-legenda small muted">1 = {e.ancoras[0]} · 5 = {e.ancoras[1]}</div>
}

function Pergunta({ p, escala, valor, falta, onNota }) {
  const e = ESCALAS_COLAB[escala]
  return (
    <div id={'q-' + p.id} className={'av-q' + (falta ? ' falta' : '')}>
      <p className="av-q-t">{p.texto}</p>
      <div className="av-escala" role="radiogroup" aria-label={p.texto}>
        {e.valores.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => onNota(v)}>{v}</button>
        ))}
        <button type="button" role="radio" className="na" aria-checked={valor === NAO_SEI} onClick={() => onNota(NAO_SEI)}>{e.na}</button>
      </div>
    </div>
  )
}
