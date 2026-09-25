import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, MODALIDADE_LABEL, GLOBAL_SUPERVISOR_ROLES } from '../lib/config.js'
import { mediasPorDimensao, rotuloCurso } from '../lib/escopo.js'
import { fmtNota, fmtInt, textoComentario } from '../lib/cpa.js'
import {
  MSG_FORTE,
  MSG_OPORTUNIDADE,
  dimensoesOrdenadas,
  cursosCriticos,
  professoresCriticos,
  comentariosCriticos,
  contarComentariosCursos,
  cursosOrdenados,
} from '../lib/criticos.js'
import { Anel, BarraNota, Carregando, Erro, Vazio } from '../components/ui.jsx'
import './resultados.css'

// Filtro de modalidade + curso, usado nas telas de resultado.
// comTodos: inclui "Todos os cursos deste recorte" (valor '').
export function FiltroCursos({ cursos, modalidade, curso, onModalidade, onCurso, comTodos, idPrefixo }) {
  const lista = modalidade ? cursos.filter((c) => c.modalidade === modalidade) : cursos
  return (
    <div className="filtros">
      <label className="sr-only" htmlFor={idPrefixo + '-mod'}>Modalidade</label>
      <select id={idPrefixo + '-mod'} className="input" value={modalidade} onChange={(e) => onModalidade(e.target.value)}>
        <option value="">Todas as modalidades</option>
        {Object.entries(MODALIDADE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <label className="sr-only" htmlFor={idPrefixo + '-curso'}>Curso</label>
      <select id={idPrefixo + '-curso'} className="input" value={curso} onChange={(e) => onCurso(e.target.value)} style={{ minWidth: 260, maxWidth: '100%' }}>
        {comTodos && <option value="">Todos os cursos deste recorte</option>}
        {!comTodos && !lista.length && <option value="">Nenhum curso nesta modalidade</option>}
        {lista.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
      </select>
    </div>
  )
}

export default function Executiva({ perfil, base, escopo }) {
  const { notas, professores } = base
  const doEscopo = useMemo(() => cursosOrdenados(base, escopo), [base, escopo])
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const [modalidade, setModalidade] = useState('')
  const [curso, setCurso] = useState('')
  const [totalComent, setTotalComent] = useState({ chave: null })

  const sel = useMemo(() => {
    if (curso) return [curso]
    return (modalidade ? doEscopo.filter((c) => c.modalidade === modalidade) : doEscopo).map((c) => c.id)
  }, [curso, modalidade, doEscopo])
  const chaveSel = sel.join(',')
  const todosDoBanco = perfil.global && !curso && !modalidade

  useEffect(() => {
    let vivo = true
    contarComentariosCursos(todosDoBanco ? null : chaveSel.split(',').filter(Boolean))
      .then((n) => vivo && setTotalComent({ chave: chaveSel, n }))
      .catch(() => vivo && setTotalComent({ chave: chaveSel, n: null }))
    return () => {
      vivo = false
    }
  }, [chaveSel, todosDoBanco])

  const medias = useMemo(() => mediasPorDimensao(notas, sel), [notas, sel])
  const sat = medias[SATISFACAO]
  const ordenadas = dimensoesOrdenadas(medias)
  const fortes = ordenadas.slice(0, 2)
  const oportunidades = ordenadas.slice(-2).reverse()
  const melhor = ordenadas[0]
  const pior = ordenadas[ordenadas.length - 1]
  const executivo = GLOBAL_SUPERVISOR_ROLES.includes(perfil.role)

  const rotulo = curso ? `Visão geral do curso · ${rotuloCurso(porId[curso])}` : sel.length > 1 ? `Visão geral · agregando ${sel.length} curso(s)` : 'Visão geral'

  // Top cursos: só para quem coordena mais de 3 cursos, olhando todos os cursos
  const meus = (perfil.cursos || []).filter((id) => porId[id])
  const mostrarTop = meus.length > 3 && !curso
  const topN = meus.length > 10 ? 5 : 3
  const top = mostrarTop
    ? meus
        .map((id) => ({ id, nota: notas[id]?.[SATISFACAO] }))
        .filter((x) => x.nota != null)
        .sort((a, b) => b.nota - a.nota)
        .slice(0, topN)
    : []

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">{rotulo}</div>
          <h1>Visão executiva</h1>
        </div>
      </section>

      <FiltroCursos
        cursos={doEscopo}
        modalidade={modalidade}
        curso={curso}
        onModalidade={(m) => { setModalidade(m); setCurso('') }}
        onCurso={setCurso}
        comTodos
        idPrefixo="ex"
      />

      {!sel.length ? (
        <Vazio>Nenhum curso neste recorte.</Vazio>
      ) : (
        <>
          <section className="card escuro res-hero">
            <Anel valor={sat} rotulo="Satisfação geral" />
            <div className="meio">
              <div className="eyebrow" style={{ color: '#9FE0B8' }}>Satisfação geral</div>
              <div className="small muted">Escala de 0 a 10 · média das respostas dos alunos</div>
            </div>
            <div className="minis">
              <div className="res-mini"><span className="n">{fmtInt(sel.length)}</span><span className="l">curso(s) nesta visão</span></div>
              {sel.some((id) => base.respondentes?.[id] != null) && (
                <div className="res-mini"><span className="n">{fmtInt(sel.reduce((s, id) => s + (base.respondentes?.[id] || 0), 0))}</span><span className="l">alunos responderam</span></div>
              )}
              <div className="res-mini">
                <span className="n">{totalComent.chave === chaveSel && totalComent.n != null ? fmtInt(totalComent.n) : '—'}</span>
                <span className="l">comentários recebidos</span>
              </div>
            </div>
          </section>

          {melhor && (
            <section className="res-grid-auto">
              <div className="card res-kpi">
                <span className="l">Melhor item avaliado</span>
                <span className="v">{melhor}</span>
                <span className="small muted">nota {fmtNota(medias[melhor])}</span>
              </div>
              <div className="card res-kpi">
                <span className="l">Precisa melhorar</span>
                <span className="v">{pior}</span>
                <span className="small muted">nota {fmtNota(medias[pior])}</span>
              </div>
            </section>
          )}

          {!executivo && (
            <>
              <section className="coluna">
                <h2>Pontos fortes — o que está funcionando bem</h2>
                <div className="res-grid-auto">
                  {fortes.map((d) => (
                    <div key={d} className="destaque forte">
                      <span className="tag">Ponto forte</span>
                      <span className="cat">{d}</span>
                      <span className="val">{fmtNota(medias[d])}</span>
                      <span className="msg">{MSG_FORTE[d]}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="coluna">
                <h2>Oportunidades de melhoria</h2>
                <div className="res-grid-auto">
                  {oportunidades.map((d) => (
                    <div key={d} className="destaque oport">
                      <span className="tag">Oportunidade</span>
                      <span className="cat">{d}</span>
                      <span className="val">{fmtNota(medias[d])}</span>
                      <span className="msg">{MSG_OPORTUNIDADE[d]}</span>
                    </div>
                  ))}
                </div>
              </section>
              {mostrarTop && top.length > 0 && (
                <section className="card">
                  <div className="card-h">
                    <div className="t">
                      <h2>Top {topN} dos seus {meus.length} cursos</h2>
                      <p className="muted small">Pela satisfação geral.</p>
                    </div>
                  </div>
                  <div>
                    {top.map((x, i) => (
                      <div key={x.id} className="rank">
                        <span className="pos">{i + 1}</span>
                        <div className="cabeca"><b>{rotuloCurso(porId[x.id])}</b><span className="num">{fmtNota(x.nota)}</span></div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {executivo && (
            <section className="coluna">
              <Acordeao titulo="Ranking — 10 cursos com menor avaliação neste recorte">
                <RankingCriticos notas={notas} sel={sel} porId={porId} />
              </Acordeao>
              <Acordeao titulo="Professores que mais precisam de atenção neste recorte">
                <ProfessoresCriticos professores={professores} sel={sel} porId={porId} />
              </Acordeao>
              <Acordeao titulo="Amostra de comentários que pedem atenção">
                <ComentariosCriticos sel={todosDoBanco ? null : sel} porId={porId} />
              </Acordeao>
            </section>
          )}

          <section className="card">
            <div className="card-h">
              <div className="t">
                <h2>Detalhamento completo por categoria</h2>
                <p className="muted small">Média simples dos cursos deste recorte (1 a 5). A linha tracejada é a meta de 4,0.</p>
              </div>
            </div>
            <div>
              {DIMENSOES.map((d) => (
                <div className="linha-dim" key={d}>
                  <span className="nome">{d}</span>
                  <BarraNota v={medias[d]} />
                  <div className="num" style={{ fontSize: 24, textAlign: 'right' }}>{fmtNota(medias[d])}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}

// Acordeão que só monta o conteúdo depois de aberto (as consultas saem só quando alguém abre)
function Acordeao({ titulo, children }) {
  const [aberto, setAberto] = useState(false)
  return (
    <details className="acordeao" onToggle={(e) => setAberto(e.currentTarget.open)}>
      <summary>{titulo}</summary>
      {aberto && <div className="corpo">{children}</div>}
    </details>
  )
}

function RankingCriticos({ notas, sel, porId }) {
  const piores = useMemo(() => cursosCriticos(notas, sel), [notas, sel])
  const chave = piores.map((x) => x.id).join(',')
  const [coment, setComent] = useState({ chave: null })

  useEffect(() => {
    let vivo = true
    const ids = chave.split(',').filter(Boolean)
    Promise.all(ids.map((id) => comentariosCriticos({ cursos: [id], limite: 2 })))
      .then((r) => vivo && setComent({ chave, porCurso: Object.fromEntries(ids.map((id, i) => [id, r[i]])) }))
      .catch((e) => vivo && setComent({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave])

  if (!piores.length) return <Vazio>Nenhum curso com nota neste recorte.</Vazio>
  const pronto = coment.chave === chave
  return (
    <div>
      <Erro erro={pronto ? coment.erro : null} />
      {piores.map((it, i) => {
        const cms = pronto && coment.porCurso ? coment.porCurso[it.id] || [] : null
        return (
          <div key={it.id} className="rank">
            <span className="pos">{i + 1}</span>
            <div>
              <div className="cabeca"><b>{rotuloCurso(porId[it.id])}</b><span className="num">{fmtNota(it.sat, 1)}</span></div>
              {it.fragilidade && <div className="frag">Maior fragilidade: {it.fragilidade} ({fmtNota(it.notaFragilidade)})</div>}
              {cms == null && !coment.erro && <div className="cit vazio">Buscando comentários…</div>}
              {cms && !cms.length && <div className="cit vazio">Nenhum comentário crítico identificado ainda para este curso.</div>}
              {cms && cms.map((c) => <div key={c.id} className="cit">“{textoComentario(c.texto)}”</div>)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProfessoresCriticos({ professores, sel, porId }) {
  const piores = useMemo(() => professoresCriticos(professores, sel), [professores, sel])
  if (!piores.length) return <Vazio>Nenhum dado de professor disponível neste recorte.</Vazio>
  return (
    <div>
      {piores.map((p, i) => (
        <div key={p.curso_id + p.nome + i} className="rank">
          <span className="pos">{i + 1}</span>
          <div>
            <div className="cabeca"><b>{p.nome}</b><span className="num">{fmtNota(p.nota)}</span></div>
            <div className="frag">
              {rotuloCurso(porId[p.curso_id])}{p.disciplina ? ' · ' + p.disciplina : ''} · {fmtInt(p.respondentes || 0)} aluno(s) responderam
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ComentariosCriticos({ sel, porId }) {
  const chave = sel ? sel.join(',') : '*'
  const [estado, setEstado] = useState({ chave: null })
  useEffect(() => {
    let vivo = true
    comentariosCriticos({ cursos: chave === '*' ? null : chave.split(','), limite: 8 })
      .then((r) => vivo && setEstado({ chave, itens: r }))
      .catch((e) => vivo && setEstado({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave])
  if (estado.chave !== chave) return <Carregando texto="Buscando comentários…" />
  if (estado.erro) return <Erro erro={estado.erro} />
  if (!estado.itens.length) return <Vazio>Nenhum comentário crítico identificado neste recorte.</Vazio>
  return (
    <div>
      {estado.itens.map((c) => (
        <div key={c.id} className="rank sem-num">
          <div>
            <div className="cabeca"><b>{rotuloCurso(porId[c.curso_id])}</b><span className="selo cinza">{c.categoria}</span></div>
            <div className="cit">“{textoComentario(c.texto)}”</div>
          </div>
        </div>
      ))}
    </div>
  )
}
