import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, IMPORTA_ROLES } from '../lib/config.js'
import { ciclosImportados, resultadosGerais, resultadosCursos, resultadosDetalhe } from '../lib/dados.js'
import { dimensaoDaPesquisa, estatisticas, fmtNota, fmtInt, nomeCurto, normalizar } from '../lib/cpa.js'
import { rotuloCurso } from '../lib/escopo.js'
import { Carregando, Erro, Vazio, Distribuicao, Legenda } from '../components/ui.jsx'
import { ListaComentarios } from './Comentarios.jsx'
import { ListaPlanos } from './Planos.jsx'

const CAMPOS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'nao_utilizo', 'n', 'soma']

// Soma linhas da mesma pergunta (vários cursos, turmas ou professores)
function somarPorPergunta(linhas) {
  const m = new Map()
  for (const r of linhas) {
    const k = r.survey_id + '|' + r.pergunta_posicao
    let g = m.get(k)
    if (!g) {
      g = { survey_id: r.survey_id, pesquisa: r.pesquisa, escala: r.escala, pergunta_posicao: r.pergunta_posicao, pergunta: r.pergunta }
      for (const c of CAMPOS) g[c] = 0
      m.set(k, g)
    }
    for (const c of CAMPOS) g[c] += Number(r[c]) || 0
    if (r.pergunta && r.pergunta.length > (g.pergunta || '').length) g.pergunta = r.pergunta
  }
  return [...m.values()]
}

export default function Questionarios({ perfil, base, escopo, planos, param }) {
  const [ciclos, setCiclos] = useState(null)
  const [erro, setErro] = useState(null)
  useEffect(() => {
    ciclosImportados().then(setCiclos).catch(setErro)
  }, [])
  if (erro) return <Erro erro={erro} />
  if (!ciclos) return <Carregando texto="Procurando os resultados importados…" />
  if (!ciclos.length)
    return (
      <div className="card" style={{ alignItems: 'flex-start' }}>
        <div className="eyebrow">Pergunta por pergunta</div>
        <h2>Os resultados por pergunta ainda não foram importados.</h2>
        <p className="muted">Assim que a planilha de respostas da CPA for importada, cada pergunta aparece aqui com as notas dos alunos.</p>
        {IMPORTA_ROLES.includes(perfil.role) && <a className="btn escuro" href="#/importar">Importar a planilha</a>}
      </div>
    )
  return <Painel ciclos={ciclos} perfil={perfil} base={base} escopo={escopo} planos={planos} param={param} />
}

function Painel({ ciclos, perfil, base, escopo, planos, param }) {
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const doEscopo = escopo.map((id) => porId[id]).filter(Boolean).sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b)))
  const inicial = param && escopo.includes(param) ? param : perfil.global ? 'inst' : doEscopo.length === 1 ? doEscopo[0].id : 'escopo'
  const [ciclo, setCiclo] = useState(ciclos[0].ciclo)
  const [alvo, setAlvo] = useState(inicial)
  const [estado, setEstado] = useState({ chave: null })
  const [surveyId, setSurveyId] = useState(null)
  const chave = ciclo + '|' + alvo
  const linhas = estado.chave === chave ? estado.linhas : null
  const erro = estado.chave === chave ? estado.erro : null

  useEffect(() => {
    let vivo = true
    const p = alvo === 'inst' ? resultadosGerais(ciclo) : resultadosCursos(ciclo, alvo === 'escopo' ? escopo : [alvo])
    p.then((r) => vivo && setEstado({ chave, linhas: alvo === 'inst' ? r : somarPorPergunta(r) })).catch((e) => vivo && setEstado({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave, ciclo, alvo, escopo])

  // Questionários encontrados, agrupados pela dimensão
  const pesquisas = useMemo(() => {
    if (!linhas) return []
    const m = new Map()
    for (const r of linhas) {
      if (!m.has(r.survey_id)) m.set(r.survey_id, { id: r.survey_id, nome: nomeCurto(r.pesquisa), pesquisa: r.pesquisa, dim: dimensaoDaPesquisa(r.pesquisa), escala: r.escala })
    }
    const ordem = [...DIMENSOES, SATISFACAO]
    return [...m.values()].sort((a, b) => ordem.indexOf(a.dim) - ordem.indexOf(b.dim) || a.nome.localeCompare(b.nome))
  }, [linhas])
  const atual = pesquisas.find((p) => p.id === surveyId) || pesquisas[0]
  const dims = [...new Set(pesquisas.map((p) => p.dim))]
  const irmas = atual ? pesquisas.filter((p) => p.dim === atual.dim) : []
  const imp = ciclos.find((c) => c.ciclo === ciclo)

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Pergunta por pergunta · Pesquisa CPA {ciclo}</div>
          <h1>{atual ? `${atual.nome}: como os alunos responderam cada pergunta.` : 'Pergunta por pergunta'}</h1>
        </div>
      </section>
      <div className="filtros">
        <label className="small" htmlFor="q-alvo" style={{ fontWeight: 600 }}>Ver</label>
        <select id="q-alvo" className="input" value={alvo} onChange={(e) => setAlvo(e.target.value)} style={{ minWidth: 300 }}>
          {perfil.global && <option value="inst">Instituição toda</option>}
          {!perfil.global && doEscopo.length > 1 && <option value="escopo">Todos os meus cursos</option>}
          {doEscopo.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
        </select>
        {ciclos.length > 1 && (
          <>
            <label className="small" htmlFor="q-ciclo" style={{ fontWeight: 600 }}>Ciclo</label>
            <select id="q-ciclo" className="input" value={ciclo} onChange={(e) => setCiclo(e.target.value)}>
              {ciclos.map((c) => <option key={c.id} value={c.ciclo}>{c.ciclo}</option>)}
            </select>
          </>
        )}
        {imp && <span className="small muted">Importado em {new Date(imp.importado_em).toLocaleDateString('pt-BR')} · {fmtInt(imp.respostas_nota)} notas</span>}
      </div>
      <Erro erro={erro} />
      {!linhas && !erro && <Carregando texto="Somando as respostas…" />}
      {linhas && !pesquisas.length && <Vazio>Não há respostas da pesquisa para esta seleção.</Vazio>}
      {atual && (
        <>
          <div className="chips" role="tablist" aria-label="Dimensões">
            {dims.map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={atual.dim === d}
                className="chip-btn"
                onClick={() => setSurveyId(pesquisas.find((p) => p.dim === d).id)}
              >
                {d}
              </button>
            ))}
          </div>
          {irmas.length > 1 && (
            <div className="seg" role="group" aria-label={'Questionários de ' + atual.dim}>
              {irmas.map((p) => (
                <button key={p.id} aria-pressed={p.id === atual.id} onClick={() => setSurveyId(p.id)}>{p.nome}</button>
              ))}
            </div>
          )}
          <Questionario
            key={atual.id + alvo + ciclo}
            pesquisa={atual}
            linhas={linhas.filter((r) => r.survey_id === atual.id)}
            cursoId={alvo !== 'inst' && alvo !== 'escopo' ? alvo : null}
            ciclo={ciclo}
            cursosFiltro={alvo === 'inst' ? null : alvo === 'escopo' ? escopo : [alvo]}
            base={base}
            planos={planos}
          />
        </>
      )}
    </>
  )
}

function Questionario({ pesquisa, linhas, cursoId, ciclo, cursosFiltro, base, planos }) {
  const [detalhe, setDetalhe] = useState(null)
  const [filtro, setFiltro] = useState('')
  const temProfessor = normalizar(pesquisa.pesquisa).includes('docente')

  useEffect(() => {
    if (!cursoId || !temProfessor) return
    let vivo = true
    resultadosDetalhe(ciclo, cursoId, pesquisa.id).then((r) => vivo && setDetalhe(r)).catch(() => vivo && setDetalhe([]))
    return () => {
      vivo = false
    }
  }, [ciclo, cursoId, pesquisa.id, temProfessor])

  const opcoes = useMemo(() => {
    if (!detalhe) return []
    const s = new Map()
    for (const r of detalhe) {
      const k = (r.disciplina || '—') + ' · ' + (r.professor || '—')
      s.set(k, { k, disciplina: r.disciplina, professor: r.professor })
    }
    return [...s.values()].sort((a, b) => a.k.localeCompare(b.k, 'pt-BR'))
  }, [detalhe])
  const escolhido = opcoes.find((o) => o.k === filtro)

  const base_ = escolhido
    ? somarPorPergunta(detalhe.filter((r) => (r.disciplina || '—') === (escolhido.disciplina || '—') && (r.professor || '—') === (escolhido.professor || '—')).map((r) => ({ ...r, survey_id: pesquisa.id, pesquisa: pesquisa.pesquisa })))
    : linhas
  const perguntas = base_
    .map((r) => ({ r, est: estatisticas(r) }))
    .filter((x) => x.est.n + x.est.naoUtilizo > 0)
    .sort((a, b) => (a.est.media ?? 99) - (b.est.media ?? 99))
  const tot = base_.reduce((a, r) => ({ n: a.n + (Number(r.n) || 0), soma: a.soma + (Number(r.soma) || 0) }), { n: 0, soma: 0 })
  const media = tot.n ? tot.soma / tot.n : null
  const escalaMax = pesquisa.escala === '0a10' ? 10 : 5
  const dimComent = pesquisa.dim && pesquisa.dim !== SATISFACAO ? pesquisa.dim : null
  const planosDim = planos.filter((p) => p.categoria === pesquisa.dim && (!cursosFiltro || cursosFiltro.includes(p.curso_id)))

  return (
    <section className="grid-lado">
      <div className="coluna">
        <div className="grid3">
          <div className="card escuro" style={{ padding: 20, gap: 6 }}>
            <span className="valor-grande">{fmtNota(media)}</span>
            <span className="small muted">média do questionário (de {pesquisa.escala === '0a10' ? '0 a 10' : '1 a 5'})</span>
          </div>
          <div className="card" style={{ padding: 20, gap: 6 }}>
            <span className="valor-grande">{fmtInt(tot.n)}</span>
            <span className="small" style={{ color: 'var(--ink-2)' }}>notas dadas pelos alunos</span>
          </div>
          <div className="card" style={{ padding: 20, gap: 6 }}>
            <span className="valor-grande">{perguntas.length}</span>
            <span className="small" style={{ color: 'var(--ink-2)' }}>perguntas com nota</span>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>Pergunta por pergunta</h2>
              <p className="muted small">Da média mais baixa para a mais alta. Os números aparecem como estão na pesquisa.</p>
            </div>
          </div>
          {temProfessor && cursoId && (
            <div className="filtros">
              <label className="small" htmlFor="q-prof" style={{ fontWeight: 600 }}>Disciplina e professor(a)</label>
              <select id="q-prof" className="input" value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ minWidth: 320, maxWidth: '100%' }} disabled={!detalhe}>
                <option value="">{detalhe ? `Todas as disciplinas do curso (${opcoes.length})` : 'Carregando disciplinas…'}</option>
                {opcoes.map((o) => <option key={o.k} value={o.k}>{o.k}</option>)}
              </select>
            </div>
          )}
          <Legenda escala={pesquisa.escala} />
          <div>
            {perguntas.map(({ r, est }, i) => {
              const recomenda = pesquisa.escala === '0a10' && normalizar(r.pergunta).includes('recomenda')
              return (
                <div key={r.pergunta_posicao} className={'pergunta' + (i === 0 && perguntas.length > 1 ? ' pior' : '')}>
                  <span className="pos">{r.pergunta_posicao}</span>
                  <div>
                    <p className="txt">{r.pergunta}</p>
                    <Distribuicao est={est} />
                    {recomenda && est.nps != null && (
                      <p className="small" style={{ marginTop: 10, color: 'var(--ink-2)' }}>
                        <b>NPS {est.nps}</b> · quem deu 9 ou 10 menos quem deu de 0 a 6, em % das respostas
                      </p>
                    )}
                  </div>
                  <div className="dir">
                    <span className="num">{fmtNota(est.media)}</span>
                    {i === 0 && perguntas.length > 1 ? <span className="selo laranja">mais baixa</span> : <span className="small muted">de {escalaMax}</span>}
                    <span className="small muted">{fmtInt(est.n)} {est.n === 1 ? "nota" : "notas"}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="coluna">
        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>Comentários</h2>
              <p className="muted small">{dimComent ? `${dimComent}${escolhido?.professor ? ' · ' + escolhido.professor : ''}` : 'Todas as dimensões'}</p>
            </div>
          </div>
          <ListaComentarios
            key={(cursosFiltro || []).join(',') + dimComent + (escolhido?.professor || '')}
            cursos={cursosFiltro}
            categoria={dimComent}
            professor={escolhido?.professor || null}
            base={base}
            porPagina={6}
          />
        </div>
        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>Planos desta dimensão</h2>
              <p className="muted small">{pesquisa.dim}</p>
            </div>
            <div className="spacer" />
            <span className="selo cinza">{fmtInt(planosDim.length)}</span>
          </div>
          <ListaPlanos planos={planosDim.slice(0, 8)} base={base} compacto />
        </div>
      </div>
    </section>
  )
}
