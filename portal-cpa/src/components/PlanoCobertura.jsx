import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtInt } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, useVinculos } from '../lib/planos.js'
import { Vazio } from './ui.jsx'

// Nomes curtos das colunas (o nome completo fica no title)
const CURTO = {
  'Conteúdo das Disciplinas': 'Conteúdo',
  'Infraestrutura e Atendimento': 'Infraestrutura',
  'Políticas Acadêmicas': 'Pol. Acadêmicas',
  'Políticas de Gestão': 'Pol. de Gestão',
  'Docência e Tutoria': 'Docência',
  'Satisfação Geral': 'Satisfação Geral',
}

const dimensoesDe = (p) => (p.categoria || '').split(',').map((x) => x.trim()).filter(Boolean)

// Planos que contam como cobertura dos cursos de uma pessoa: os dela e os dos professores
// auxiliares / coordenadores adjuntos dos mesmos cursos.
function planosDaCobertura(base, pessoaId, cursoIds) {
  const cursos = new Set(cursoIds)
  const aux = new Set(base.usuarios.filter((u) => u.role === 'professor_auxiliar').map((u) => u.id))
  return base.planos.filter((p) => p.tipo !== 'setor' && cursos.has(p.curso_id) && (p.usuario_id === pessoaId || aux.has(p.usuario_id)))
}

// Conta, por curso e por dimensão, quantos planos existem
function calcularCobertura(cursos, planos) {
  const linhas = cursos.map((c) => {
    const doCurso = planos.filter((p) => p.curso_id === c.id)
    const porDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, 0]))
    let semDim = 0
    for (const p of doCurso) {
      const ds = dimensoesDe(p).filter((d) => porDim[d] != null)
      if (!ds.length) semDim++
      for (const d of ds) porDim[d]++
    }
    const faltam = CATEGORIAS_PLANO.filter((d) => !porDim[d])
    return { curso: c, total: doCurso.length, porDim, semDim, faltam }
  })
  const comPlano = linhas.filter((l) => l.total > 0).length
  const completos = linhas.filter((l) => l.total > 0 && l.faltam.length === 0).length
  return { linhas, comPlano, completos, total: linhas.length }
}

const nomeCurso = (c) => c.nome || c.id
const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''

// Matriz: cursos (curso + modalidade de oferta) nas linhas, as 5 dimensões + Satisfação Geral nas colunas
export function MatrizCobertura({ cob }) {
  if (!cob.linhas.length) return <Vazio>Nenhum curso vinculado.</Vazio>
  return (
    <div className="cob-rolagem">
      <table className="cob-tabela">
        <thead>
          <tr>
            <th scope="col" className="cob-curso">Curso · modalidade</th>
            {CATEGORIAS_PLANO.map((d) => <th key={d} scope="col" title={d}>{CURTO[d] || d}</th>)}
          </tr>
        </thead>
        <tbody>
          {cob.linhas.map((l) => (
            <tr key={l.curso.id} className={l.total ? '' : 'sem-plano'}>
              <th scope="row" className="cob-curso">
                <b>{nomeCurso(l.curso)}</b>
                <span className="small muted">
                  {modalidade(l.curso)} · {l.total ? `${fmtInt(l.total)} ${l.total === 1 ? 'plano' : 'planos'}` : 'nenhum plano'}
                  {l.semDim > 0 && ` (${l.semDim} sem dimensão)`}
                </span>
              </th>
              {CATEGORIAS_PLANO.map((d) => {
                const n = l.porDim[d]
                return (
                  <td key={d} title={`${nomeCurso(l.curso)} (${modalidade(l.curso)}) · ${d}: ${n ? n + (n === 1 ? ' plano' : ' planos') : 'sem plano'}`}>
                    {n ? <span className="cob-ok">✓ {n}</span> : <span className="cob-falta">falta</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResumoCobertura({ cob }) {
  const fora = cob.total - cob.comPlano
  return (
    <div className="chips" style={{ gap: 6 }}>
      <span className={'selo ' + (fora ? 'laranja' : 'verde')}>{fmtInt(cob.comPlano)} de {fmtInt(cob.total)} {cob.total === 1 ? 'curso' : 'cursos'} com plano</span>
      <span className="selo cinza">{fmtInt(cob.completos)} com as 6 dimensões cobertas</span>
      {fora > 0 && <span className="selo laranja">{fmtInt(fora)} {fora === 1 ? 'curso sem nenhum plano' : 'cursos sem nenhum plano'}</span>}
    </div>
  )
}

// Para o coordenador: a matriz dos cursos dele, no topo de "Meus planos"
export function CoberturaMinha({ perfil, base }) {
  const [aberto, setAberto] = useState(true)
  const cursos = useMemo(() => base.cursos.filter((c) => perfil.cursos.includes(c.id)).sort(ordCurso), [base.cursos, perfil.cursos])
  const cob = useMemo(() => calcularCobertura(cursos, planosDaCobertura(base, perfil.id, perfil.cursos)), [cursos, base, perfil])
  if (!cursos.length) return null
  return (
    <section className="card" style={{ gap: 12 }}>
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">Cobertura por eixos e dimensões</span>
          <h3 style={{ fontSize: 20 }}>Seus cursos × dimensões</h3>
        </div>
        <div className="spacer" />
        <button type="button" className="btn sm" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>{aberto ? 'Recolher' : 'Mostrar'}</button>
      </div>
      <ResumoCobertura cob={cob} />
      {aberto && (
        <>
          <MatrizCobertura cob={cob} />
          <p className="small muted">Contam os seus planos e os dos professores auxiliares / coordenadores adjuntos dos mesmos cursos, em qualquer situação. Um plano pode tratar mais de uma dimensão.</p>
        </>
      )}
    </section>
  )
}

function ordCurso(a, b) {
  return nomeCurso(a).localeCompare(nomeCurso(b), 'pt-BR') || String(a.modalidade).localeCompare(String(b.modalidade))
}

// Para a CPA / Pró-Reitoria / admin: uma matriz por coordenador, com o resumo de quem deixou curso de fora
export function CoberturaGeral({ base }) {
  const { lista: vinculos, erro } = useVinculos()
  const [busca, setBusca] = useState('')
  const [soFaltando, setSoFaltando] = useState(false)
  const [abertos, setAbertos] = useState({})
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])

  const pessoas = useMemo(() => {
    if (!vinculos) return []
    const cursosDe = {}
    for (const v of vinculos) (cursosDe[v.usuario_id] ||= []).push(v.curso_id)
    return base.usuarios
      .filter((u) => u.role === 'coordenador' && cursosDe[u.id]?.length)
      .map((u) => {
        const ids = [...new Set(cursosDe[u.id])]
        const cursos = ids.map((id) => porCurso[id] || { id, nome: id, modalidade: '' }).sort(ordCurso)
        return { u, cob: calcularCobertura(cursos, planosDaCobertura(base, u.id, ids)) }
      })
      .sort((a, b) => (b.cob.total - b.cob.comPlano) - (a.cob.total - a.cob.comPlano) || a.u.nome.localeCompare(b.u.nome, 'pt-BR'))
  }, [vinculos, base, porCurso])

  if (!vinculos) return <div className="card"><span className="muted">Carregando os cursos de cada coordenador…</span></div>
  const termo = busca.trim().toLowerCase()
  const visiveis = pessoas.filter((x) => (!soFaltando || x.cob.comPlano < x.cob.total) && (!termo || x.u.nome.toLowerCase().includes(termo)))
  const totCursos = pessoas.reduce((s, x) => s + x.cob.total, 0)
  const totCom = pessoas.reduce((s, x) => s + x.cob.comPlano, 0)
  const comFalta = pessoas.filter((x) => x.cob.comPlano < x.cob.total).length
  const semNada = pessoas.filter((x) => x.cob.comPlano === 0).length

  return (
    <>
      {erro && <div className="aviso erro" role="alert">Não foi possível carregar os cursos de cada coordenador: {erro}</div>}
      <section className="card" style={{ gap: 12 }}>
        <span className="eyebrow">Cobertura por eixos e dimensões</span>
        <div className="grid3">
          <div className="kpi"><span className="v">{fmtInt(totCom)} de {fmtInt(totCursos)}</span><span className="l">cursos (por coordenador) com ao menos um plano</span></div>
          <div className="kpi"><span className="v">{fmtInt(comFalta)}</span><span className="l">coordenadores deixaram algum curso de fora</span></div>
          <div className="kpi"><span className="v">{fmtInt(semNada)}</span><span className="l">coordenadores sem nenhum plano</span></div>
        </div>
        <p className="small muted">Cada curso é o curso + a modalidade de oferta (vínculos de cada coordenador). Contam os planos do coordenador e dos professores auxiliares / coordenadores adjuntos do mesmo curso, em qualquer situação.</p>
        <div className="filtros">
          <label className="sr-only" htmlFor="cob-busca">Buscar coordenador</label>
          <input id="cob-busca" type="search" className="input" placeholder="Buscar coordenador" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <button type="button" className="chip-btn" aria-pressed={soFaltando} onClick={() => setSoFaltando(!soFaltando)}>Só quem deixou curso de fora</button>
          <span className="small muted">{fmtInt(visiveis.length)} de {fmtInt(pessoas.length)} coordenadores</span>
        </div>
      </section>
      {visiveis.length === 0 && <Vazio>Nenhum coordenador neste filtro.</Vazio>}
      {visiveis.map(({ u, cob }) => {
        const aberto = !!abertos[u.id]
        return (
          <section key={u.id} className="card cob-pessoa" style={{ gap: 10 }}>
            <button type="button" className="cob-cab" aria-expanded={aberto} onClick={() => setAbertos({ ...abertos, [u.id]: !aberto })}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <b>{u.nome}</b>
                <ResumoCobertura cob={cob} />
              </span>
              <span className="small muted">{aberto ? 'Recolher' : 'Ver matriz'}</span>
            </button>
            {aberto && <MatrizCobertura cob={cob} />}
          </section>
        )
      })}
    </>
  )
}
