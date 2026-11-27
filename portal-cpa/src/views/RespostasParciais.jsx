// Respostas parciais da CPA (depois do login): tudo o que os alunos já responderam, pergunta por pergunta, em cada
// modelo de oferta. Vem do CSV "Respostas" do painel que a CPA publica (só contagens; sem alunos e sem comentários).
// A supervisão global vê tudo; a coordenação vê as perguntas gerais e as do próprio curso (o banco já filtra).
import { useEffect, useMemo, useState } from 'react'
import { MODALIDADES_AO_VIVO, carregarRespostas, carregarResumoRespostas, fmtNum } from '../lib/aoVivo.js'
import ResumoRespostas from '../components/ResumoRespostas.jsx'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { Carregando, Vazio } from '../components/ui.jsx'
import './aoVivo.css'

// Escala de 1 a 5: insatisfação em laranja, satisfação em azul, neutro no meio; "não sei" à parte
const LIKERT = [
  { v: '1', t: 'Muito insatisfeito', cor: '#c2410c' },
  { v: '2', t: 'Insatisfeito', cor: '#f3b88a' },
  { v: '3', t: 'Neutro', cor: '#d3d8e2' },
  { v: '4', t: 'Satisfeito', cor: '#7fb4e6' },
  { v: '5', t: 'Muito satisfeito', cor: '#1c6db3' },
  { v: '6', t: 'Não sei / não utilizo', cor: '#eef0f4' },
]
const NPS = [
  { t: 'Detratores (0 a 6)', cor: '#c2410c', de: 0, ate: 6 },
  { t: 'Neutros (7 e 8)', cor: '#d3d8e2', de: 7, ate: 8 },
  { t: 'Promotores (9 e 10)', cor: '#1c6db3', de: 9, ate: 10 },
]
const nota = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const pc = (v) => Math.round(v).toLocaleString('pt-BR') + '%'
const corMedia = (v) => (v >= 4.3 ? '#1c6db3' : v >= 4 ? '#5b9bd8' : v >= 3.5 ? '#d9822b' : '#c2410c')

// Soma várias linhas da mesma pergunta (cursos diferentes, ou modalidades no "Todos")
function juntar(linhas) {
  const q = { ...linhas[0], respostas: 0, alunos: 0, distribuicao: {}, cursos: new Set() }
  let soma = 0, n = 0
  for (const l of linhas) {
    q.respostas += l.respostas
    q.alunos += l.alunos
    if (l.curso_id) q.cursos.add(l.curso_id)
    for (const [v, c] of Object.entries(l.distribuicao || {})) {
      q.distribuicao[v] = (q.distribuicao[v] || 0) + c
      const x = Number(v)
      if (l.escala === 'likert_5' && (x < 1 || x > 5)) continue
      soma += x * c
      n += c
    }
  }
  q.media = n ? soma / n : null
  q.validas = n
  return q
}

function npsDe(dist) {
  const tot = Object.values(dist).reduce((s, c) => s + c, 0) || 1
  const faixa = NPS.map((f) => Object.entries(dist).reduce((s, [v, c]) => (Number(v) >= f.de && Number(v) <= f.ate ? s + c : s), 0))
  return { faixa, tot, nps: Math.round(((faixa[2] - faixa[0]) / tot) * 100) }
}

function Barra({ q }) {
  const dist = q.distribuicao
  if (q.escala === 'nps_0_10') {
    const { faixa, tot } = npsDe(dist)
    return (
      <div className="rp-barra" role="img" aria-label={NPS.map((f, i) => `${f.t}: ${pc((faixa[i] / tot) * 100)}`).join('; ')}>
        {NPS.map((f, i) => faixa[i] > 0 && <i key={f.t} style={{ width: (faixa[i] / tot) * 100 + '%', background: f.cor, color: i === 1 ? '#1f2a44' : '#fff' }} title={`${f.t}: ${fmtNum(faixa[i])} (${pc((faixa[i] / tot) * 100)})`}>{faixa[i] / tot >= 0.08 ? pc((faixa[i] / tot) * 100) : ''}</i>)}
      </div>
    )
  }
  const tot = LIKERT.reduce((s, f) => s + (dist[f.v] || 0), 0) || 1
  return (
    <div className="rp-barra" role="img" aria-label={LIKERT.map((f) => `${f.t}: ${pc(((dist[f.v] || 0) / tot) * 100)}`).join('; ')}>
      {LIKERT.map((f) => (dist[f.v] || 0) > 0 && (
        <i key={f.v} style={{ width: ((dist[f.v] || 0) / tot) * 100 + '%', background: f.cor, color: f.v === '1' || f.v === '5' ? '#fff' : '#1f2a44' }} title={`${f.t}: ${fmtNum(dist[f.v])} (${pc(((dist[f.v] || 0) / tot) * 100)})`}>
          {(dist[f.v] || 0) / tot >= 0.08 ? pc(((dist[f.v] || 0) / tot) * 100) : ''}
        </i>
      ))}
    </div>
  )
}

export default function RespostasParciais({ base }) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [mod, setMod] = useState('')
  const [pesq, setPesq] = useState('')
  const [curso, setCurso] = useState('')
  const [ordem, setOrdem] = useState('questionario')

  const [resumo, setResumo] = useState(null)
  useEffect(() => {
    let vivo = true
    carregarResumoRespostas().then((x) => vivo && setResumo(x)).catch(() => {})
    carregarRespostas().then((x) => vivo && setDados(x)).catch((e) => vivo && setErro(e))
    return () => { vivo = false }
  }, [])

  const mods = useMemo(() => MODALIDADES_AO_VIVO.filter((m) => dados?.pesquisas.some((p) => p.modalidade === m.k)), [dados])
  const modAtual = mod || mods[0]?.k || ''
  const nomeCurso = (id) => {
    const c = base.cursos.find((x) => x.id === id)
    return c ? `${c.nome} · ${MODALIDADE_LABEL[c.modalidade] || c.modalidade}` : id
  }
  const daMod = (l) => modAtual === 'TODOS' || l.modalidade === modAtual

  const pesquisas = useMemo(() => {
    const m = new Map()
    for (const p of dados?.pesquisas || []) {
      if (!daMod(p)) continue
      const x = m.get(p.pesquisa) || { pesquisa: p.pesquisa, alunos: 0, concluiram: 0 }
      x.alunos += p.alunos
      x.concluiram += p.concluiram
      m.set(p.pesquisa, x)
    }
    return [...m.values()].sort((a, b) => b.alunos - a.alunos)
  }, [dados, modAtual]) // eslint-disable-line react-hooks/exhaustive-deps

  const cursos = useMemo(() => [...new Set((dados?.perguntas || []).filter((q) => daMod(q) && q.curso_id).map((q) => q.curso_id))].sort((a, b) => nomeCurso(a).localeCompare(nomeCurso(b), 'pt-BR')), [dados, modAtual]) // eslint-disable-line react-hooks/exhaustive-deps

  // Perguntas do filtro, somando cursos (e modalidades no "Todos") pela mesma pergunta
  const grupos = useMemo(() => {
    const m = new Map()
    for (const q of dados?.perguntas || []) {
      if (!daMod(q) || (pesq && q.pesquisa !== pesq)) continue
      if (curso && q.curso_id && q.curso_id !== curso) continue
      const k = q.pesquisa + '|' + (modAtual === 'TODOS' ? q.pergunta : q.n_pergunta + '|' + q.pergunta)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(q)
    }
    const qs = [...m.values()].map(juntar)
    const porPesq = new Map()
    for (const q of qs) {
      if (!porPesq.has(q.pesquisa)) porPesq.set(q.pesquisa, [])
      porPesq.get(q.pesquisa).push(q)
    }
    const ordemPesq = pesquisas.map((p) => p.pesquisa)
    return [...porPesq.entries()]
      .sort((a, b) => ordemPesq.indexOf(a[0]) - ordemPesq.indexOf(b[0]))
      .map(([nome, lista]) => {
        const notas = lista.filter((q) => q.escala === 'likert_5' && q.media != null)
        const media = notas.length ? notas.reduce((s, q) => s + q.media * q.validas, 0) / notas.reduce((s, q) => s + q.validas, 0) : null
        const ord = [...lista].sort((a, b) =>
          ordem === 'piores'
            ? (a.tipo === 'textarea') - (b.tipo === 'textarea') || (a.escala === 'nps_0_10' ? a.media / 2 : a.media ?? 9) - (b.escala === 'nps_0_10' ? b.media / 2 : b.media ?? 9)
            : a.n_pergunta - b.n_pergunta)
        return { nome, media, perguntas: ord }
      })
  }, [dados, modAtual, pesq, curso, ordem, pesquisas]) // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) return <div className="aviso erro" role="alert">Não foi possível carregar as respostas: {erro.message}</div>
  if (!dados) return <Carregando texto="Carregando as respostas da CPA…" />

  const atualizado = [...dados.pesquisas, ...dados.perguntas].reduce((m, p) => (p.publicado_em > m ? p.publicado_em : m), '')

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Parcial da CPA {dados.ciclo || ''} · pergunta por pergunta</div>
          <h1>Tudo o que os alunos já responderam.</h1>
          <p className="muted">Distribuição das notas e média de cada pergunta, por modelo de oferta e questionário. {atualizado && `Atualizado em ${new Date(atualizado).toLocaleString('pt-BR')}.`} Resultado parcial: a avaliação ainda está aberta.</p>
        </div>
      </section>

      {resumo && Object.keys(resumo).length > 0 && (
        <section className="card" style={{ gap: 12 }}>
          <div className="card-h"><div className="t"><h2>Panorama do arquivo</h2><p className="muted small">Funil de conclusão, dias e horários, semestre, curso e tempo de resposta, tirados do último CSV de Respostas publicado.</p></div></div>
          <ResumoRespostas resumo={resumo} nomeCurso={(id) => { const c = base.cursos.find((x) => x.id === id); return c ? `${c.nome}` : id }} />
        </section>
      )}
      {!dados.perguntas.length ? (
        <Vazio>A CPA ainda não publicou as respostas deste ciclo. Em "Atualizar números da CPA", passo 4, suba o CSV de Respostas de cada modelo de oferta.</Vazio>
      ) : (
        <>
          <section className="card" style={{ gap: 14 }}>
            <div className="pr-filtros">
              <div className="seg" role="group" aria-label="Modelo de oferta">
                {mods.length > 1 && <button aria-pressed={modAtual === 'TODOS'} onClick={() => { setMod('TODOS'); setCurso('') }}>Todos</button>}
                {mods.map((m) => <button key={m.k} aria-pressed={modAtual === m.k} onClick={() => { setMod(m.k); setCurso(''); setPesq('') }}>{m.t}</button>)}
              </div>
              {cursos.length > 0 && (
                <label className="campo"><span className="small muted">Curso (vale para as perguntas com curso, como Docente)</span>
                  <select className="input" value={curso} onChange={(e) => setCurso(e.target.value)}>
                    <option value="">Todos os cursos</option>
                    {cursos.map((id) => <option key={id} value={id}>{nomeCurso(id)}</option>)}
                  </select>
                </label>
              )}
              <div className="seg" role="group" aria-label="Ordenar">
                <button aria-pressed={ordem === 'questionario'} onClick={() => setOrdem('questionario')}>Ordem do questionário</button>
                <button aria-pressed={ordem === 'piores'} onClick={() => setOrdem('piores')}>Piores notas primeiro</button>
              </div>
            </div>

            <div className="rp-pesquisas">
              <button className={'rp-pesq' + (!pesq ? ' ativo' : '')} onClick={() => setPesq('')}><b>Todos os questionários</b><span>{pesquisas.length} questionários</span></button>
              {pesquisas.map((p) => (
                <button key={p.pesquisa} className={'rp-pesq' + (pesq === p.pesquisa ? ' ativo' : '')} onClick={() => setPesq(p.pesquisa)}>
                  <b>{p.pesquisa}</b><span>{fmtNum(p.concluiram)} concluíram · {fmtNum(p.alunos)} iniciaram</span>
                </button>
              ))}
            </div>

            <div className="rp-leg" aria-label="Legenda">
              {LIKERT.map((f) => <span key={f.v}><i style={{ background: f.cor }} />{f.v === '6' ? f.t : `${f.v} · ${f.t}`}</span>)}
              <span className="small muted">Perguntas de 0 a 10: detratores (0 a 6), neutros (7 e 8) e promotores (9 e 10); NPS = % promotores − % detratores.</span>
            </div>
          </section>

          {grupos.map((g) => (
            <section className="card rp-bloco" key={g.nome}>
              <div className="rp-cab">
                <h2>{g.nome}</h2>
                {g.media != null && <span className="rp-media" style={{ color: corMedia(g.media) }}>Média {nota(g.media)} <small>de 5</small></span>}
              </div>
              {g.perguntas.map((q) => (
                <div className="rp-q" key={q.pesquisa + q.n_pergunta + q.pergunta}>
                  <div className="rp-txt">
                    <span className="rp-n">{q.n_pergunta}</span>
                    <span>{q.pergunta}{q.cursos.size > 1 && !curso && <span className="small muted"> · {q.cursos.size} cursos</span>}</span>
                  </div>
                  {q.tipo === 'textarea' ? (
                    <p className="small muted rp-aberta">Pergunta aberta: {fmtNum(q.respostas)} comentários. Os textos não entram no Portal.</p>
                  ) : (
                    <div className="rp-linha">
                      <Barra q={q} />
                      <div className="rp-num">
                        {q.escala === 'nps_0_10' ? (
                          <><b>NPS {npsDe(q.distribuicao).nps}</b><small>média {nota(q.media)} de 10</small></>
                        ) : (
                          <><b style={{ color: q.media != null ? corMedia(q.media) : undefined }}>{nota(q.media)}</b><small>{fmtNum(q.respostas)} respostas</small></>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </>
  )
}
