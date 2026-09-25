import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, META, MODALIDADE_LABEL } from '../lib/config.js'
import { mediasPorDimensao, rotuloCurso } from '../lib/escopo.js'
import { carregarTurmas } from '../lib/dados.js'
import { fmtNota, fmtInt } from '../lib/cpa.js'
import { BarraNota, Delta, Carregando, Erro, Vazio } from '../components/ui.jsx'
import { ListaComentarios } from './Comentarios.jsx'
import { ListaPlanos } from './Planos.jsx'
import BotoesPdf from '../components/BotoesPdf.jsx'

const CURTO = {
  'Conteúdo das Disciplinas': 'Conteúdo',
  'Infraestrutura e Atendimento': 'Infraestrutura',
  'Políticas Acadêmicas': 'Pol. acadêmicas',
  'Políticas de Gestão': 'Pol. de gestão',
  'Docência e Tutoria': 'Docência',
}

function corCelula(v) {
  if (v == null) return { background: 'var(--track)', color: 'var(--muted)' }
  if (v < 3.5) return { background: '#8E3413', color: '#fff' }
  if (v < 4) return { background: '#F6C9AE', color: '#4A1C08' }
  if (v < 4.3) return { background: '#D3E5F6', color: '#0B3A63' }
  return { background: '#1C6DB3', color: '#fff' }
}

export default function Curso({ perfil, base, escopo, planos, param, recarregarBase }) {
  const { cursos, notas, professores } = base
  const porId = useMemo(() => Object.fromEntries(cursos.map((c) => [c.id, c])), [cursos])
  const doEscopo = escopo.map((id) => porId[id]).filter(Boolean)
  const id = param && escopo.includes(param) ? param : doEscopo.length === 1 ? doEscopo[0].id : ''

  if (!id) return <EscolherCurso cursos={doEscopo} notas={notas} />
  return <UmCurso key={id} curso={porId[id]} perfil={perfil} recarregarBase={recarregarBase} base={base} escopo={escopo} planos={planos} professores={professores} irmaos={doEscopo.filter((c) => c.nome === porId[id].nome)} />
}

function EscolherCurso({ cursos, notas }) {
  const [busca, setBusca] = useState('')
  const lista = cursos.filter((c) => rotuloCurso(c).toLowerCase().includes(busca.toLowerCase()))
  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Resultados por curso</div>
          <h1>Escolha um curso</h1>
        </div>
        <div className="spacer" />
        <label className="sr-only" htmlFor="busca-curso">Buscar curso</label>
        <input id="busca-curso" className="input" style={{ width: 300 }} placeholder="Buscar curso" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="grid3">
        {lista.map((c) => {
          const v = notas[c.id]?.[SATISFACAO]
          return (
            <a key={c.id} href={'#/curso/' + c.id} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: 20, gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{c.nome}</span>
              <span className="small muted">{MODALIDADE_LABEL[c.modalidade]}</span>
              <span className="num" style={{ fontSize: 30 }}>{fmtNota(v)} <span className="small muted" style={{ fontFamily: 'var(--f-ui)' }}>satisfação</span></span>
            </a>
          )
        })}
      </div>
    </>
  )
}

function UmCurso({ curso, perfil, base, escopo, planos, professores, irmaos, recarregarBase }) {
  const { notas, cursos } = base
  const [turmas, setTurmas] = useState(null)
  const [erro, setErro] = useState(null)
  const inst = useMemo(() => mediasPorDimensao(notas, cursos.map((c) => c.id)), [notas, cursos])
  const n = notas[curso.id] || {}

  useEffect(() => {
    let vivo = true
    carregarTurmas(curso.id).then((t) => vivo && setTurmas(t)).catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [curso.id])

  const mapa = useMemo(() => {
    if (!turmas) return []
    const m = {}
    for (const t of turmas) (m[t.turma] ||= {})[t.categoria] = Number(t.nota)
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR', { numeric: true }))
  }, [turmas])

  const pior = DIMENSOES.map((d) => ({ d, v: n[d] })).filter((x) => x.v != null).sort((a, b) => a.v - b.v)[0]
  const turmasAbaixo = pior ? mapa.filter(([, v]) => v[pior.d] != null && v[pior.d] < META) : []
  const profs = professores.filter((p) => p.curso_id === curso.id).sort((a, b) => a.nota - b.nota)
  const planosCurso = planos.filter((p) => p.curso_id === curso.id)
  const verProfessores = perfil.role !== 'professor_auxiliar'

  return (
    <>
      <nav aria-label="Você está em" className="small muted" style={{ display: 'flex', gap: 8 }}>
        {escopo.length > 1 && <><a href="#/curso">Cursos</a><span aria-hidden="true">/</span></>}
        <span>{rotuloCurso(curso)}</span>
      </nav>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Resultados do curso</div>
          <h1 className="h1-grande">{curso.nome}</h1>
          {irmaos.length > 1 && (
            <div className="chips" role="group" aria-label="Modalidade">
              {irmaos.map((c) => (
                <a key={c.id} href={'#/curso/' + c.id} className="chip-btn" aria-pressed={c.id === curso.id} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                  {MODALIDADE_LABEL[c.modalidade]}
                </a>
              ))}
            </div>
          )}
          <BotoesPdf tipos={['curso', 'geral']} base={base} escopo={escopo} cursoId={curso.id} />
        </div>
        <div className="spacer" />
        <div className="card escuro" style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, padding: '18px 24px' }}>
          <span className="valor-grande" style={{ fontSize: 52 }}>{fmtNota(n[SATISFACAO])}</span>
          <span className="small" style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ color: '#9FE0B8' }}>Satisfação geral</b>
            <span className="muted">média institucional {fmtNota(inst[SATISFACAO])}</span>
          </span>
        </div>
      </section>

      <section className="grid5">
        {DIMENSOES.map((d) => (
          <a key={d} href={'#/questionarios/' + curso.id} className="card" style={{ padding: 20, gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <span className="small" style={{ fontWeight: 600, color: 'var(--ink-2)', minHeight: 36 }}>{d}</span>
            <span className="valor-grande">{fmtNota(n[d])}</span>
            <Delta v={n[d]} base={inst[d]} />
          </a>
        ))}
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>Mapa de calor das turmas</h2>
              <p className="muted small">Nota de cada turma em cada dimensão. As células em laranja escuro pedem ação primeiro.</p>
            </div>
          </div>
          <Erro erro={erro} />
          {!turmas && !erro && <Carregando texto="Carregando as turmas…" />}
          {turmas && !mapa.length && <Vazio>Nenhuma turma com nota para este curso.</Vazio>}
          {mapa.length > 0 && (
            <div className="rolagem">
              <div className="calor" style={{ gridTemplateColumns: '120px repeat(5, minmax(84px, 1fr))', minWidth: 560 }}>
                <span className="cab-col">Turma</span>
                {DIMENSOES.map((d) => <span key={d} className="cab-col">{CURTO[d]}</span>)}
                {mapa.map(([t, v]) => (
                  <Linha key={t} t={t} v={v} />
                ))}
              </div>
            </div>
          )}
          <div className="legenda">
            <span><i style={{ background: '#8E3413' }} />abaixo de 3,5</span>
            <span><i style={{ background: '#F6C9AE' }} />3,5 a 3,99</span>
            <span><i style={{ background: '#D3E5F6' }} />4,0 a 4,29</span>
            <span><i style={{ background: '#1C6DB3' }} />4,3 ou mais</span>
            <span><i style={{ background: 'var(--track)' }} />sem nota</span>
          </div>
        </div>

        <div className="coluna">
          {pior && (
            <div className="card azul">
              <div className="eyebrow" style={{ color: '#9FE0B8' }}>Onde agir primeiro</div>
              <div className="num" style={{ fontSize: 26, lineHeight: 1.2 }}>
                {pior.d} é a dimensão mais baixa ({fmtNota(pior.v)})
                {turmas ? `, abaixo da meta em ${turmasAbaixo.length} de ${mapa.filter(([, v]) => v[pior.d] != null).length} turmas.` : '.'}
              </div>
              {turmasAbaixo.length > 0 && (
                <p className="small muted" style={{ lineHeight: 1.55 }}>
                  Turmas mais baixas: {turmasAbaixo.sort((a, b) => a[1][pior.d] - b[1][pior.d]).slice(0, 3).map(([t, v]) => `${t} (${fmtNota(v[pior.d])})`).join(', ')}.
                </p>
              )}
              <a className="btn claro" href={'#/questionarios/' + curso.id}>Ver pergunta por pergunta</a>
            </div>
          )}
          <div className="card">
            <div className="card-h">
              <div className="t"><h2>Planos deste curso</h2></div>
              <div className="spacer" />
              <span className="selo cinza">{fmtInt(planosCurso.length)}</span>
            </div>
            <ListaPlanos planos={planosCurso.slice(0, 6)} base={base} perfil={perfil} onMudou={() => recarregarBase()} compacto />
            {planosCurso.length > 6 && <a className="btn sm" href="#/planos">Ver todos</a>}
          </div>
        </div>
      </section>

      {verProfessores && profs.length > 0 && (
        <section className="card">
          <div className="card-h">
            <div className="t">
              <h2>Por professor</h2>
              <p className="muted small">Nota de Docência por professor e disciplina, da menor para a maior.</p>
            </div>
          </div>
          <div className="rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Professor(a)</th><th>Disciplina</th><th style={{ textAlign: 'right' }}>Respondentes</th><th style={{ textAlign: 'right' }}>Nota</th><th style={{ width: 140 }}></th></tr>
              </thead>
              <tbody>
                {profs.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td>{p.disciplina || '—'}</td>
                    <td className="n">{fmtInt(p.respondentes)}</td>
                    <td className="n num" style={{ fontSize: 18 }}>{fmtNota(Number(p.nota))}</td>
                    <td><BarraNota v={Number(p.nota)} fina /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Comentários do curso</h2>
            <p className="muted small">Exatamente como os alunos escreveram.</p>
          </div>
        </div>
        <ListaComentarios cursos={[curso.id]} base={base} porPagina={8} />
      </section>
    </>
  )
}

function Linha({ t, v }) {
  return (
    <>
      <span className="rot">{t}</span>
      {DIMENSOES.map((d) => (
        <span key={d} className="cel" style={corCelula(v[d])}>{v[d] == null ? '—' : fmtNota(v[d])}</span>
      ))}
    </>
  )
}
