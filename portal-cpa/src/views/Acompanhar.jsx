// Acompanhar: só os gabaritos de entrega dos planos de ação. Um coordenador (ou um curso) por vez, para a tela
// não pesar. Linhas = cursos (curso + modalidade de oferta), colunas = questionários; cada célula mostra se o
// plano foi enviado, está escrito e parado, voltou devolvido ou falta. Gera o PDF de pendências para o coordenador.
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtInt } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, useVinculos } from '../lib/planos.js'
import {
  CURTO_DIM, ESTADO_CELULA, acaoPendente, calcularCobertura, coberturaPorCoordenador, mensagemCobranca, nomeCurso, ordCurso,
} from '../lib/cobertura.js'
import { Vazio } from '../components/ui.jsx'
import './planos.css'

const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const ICONE = { ok: '✓', nao_enviado: '✎', devolvido: '↩', falta: '✗' }
const FILTROS = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['concluidos', 'Concluídos']]

export default function Acompanhar({ base }) {
  const { lista: vinculos, erro } = useVinculos()
  const [modo, setModo] = useState('coord')
  const [busca, setBusca] = useState('')
  const [soPend, setSoPend] = useState(true)
  const [sel, setSel] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [aviso, setAviso] = useState(null)

  const pessoas = useMemo(() => coberturaPorCoordenador(base, vinculos), [base, vinculos])
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''

  // Por curso: agrupa curso + modalidades e junta os planos de todos os autores do curso
  const cursos = useMemo(() => {
    if (!vinculos) return []
    const grupos = new Map()
    for (const c of [...base.cursos].sort(ordCurso)) {
      const k = nomeCurso(c)
      if (!grupos.has(k)) grupos.set(k, [])
      grupos.get(k).push(c)
    }
    return [...grupos.entries()].map(([nome, cs]) => {
      const ids = new Set(cs.map((c) => c.id))
      const cob = calcularCobertura(cs, base.planos.filter((p) => p.tipo !== 'setor' && ids.has(p.curso_id)))
      const pend = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
      return { k: nome, nome, cob, pend }
    }).sort((a, b) => b.pend - a.pend || a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [base, vinculos])

  if (erro) return <div className="aviso erro" role="alert">Não foi possível carregar os vínculos de coordenadores e cursos: {erro}</div>
  if (!vinculos) return <div className="card"><span className="muted">Carregando os coordenadores e cursos…</span></div>

  const lista = modo === 'coord'
    ? pessoas.map((x) => ({ k: x.u.id, nome: x.u.nome, pend: x.pend, total: x.cob.total, cob: x.cob, pessoa: x.u }))
    : cursos.map((x) => ({ k: x.k, nome: x.nome, pend: x.pend, total: x.cob.total, cob: x.cob }))
  const termo = busca.trim().toLowerCase()
  const visiveis = lista.filter((x) => (!soPend || x.pend > 0) && (!termo || x.nome.toLowerCase().includes(termo)))
  const atual = lista.find((x) => x.k === sel)
  const comPend = lista.filter((x) => x.pend > 0).length

  const coordsDoCurso = (cid) => {
    const ids = new Set(vinculos.filter((v) => v.curso_id === cid).map((v) => v.usuario_id))
    return base.usuarios.filter((u) => ids.has(u.id) && u.role === 'coordenador').map((u) => u.nome)
  }
  const baixarPdf = async (pessoa, cob) => {
    setAviso({ tipo: '', txt: 'Gerando o PDF…' })
    try {
      const pdf = await import('../lib/pdf.js')
      setAviso({ tipo: 'ok', txt: await pdf.baixarPdfPendencias({ base, pessoa, cob }) })
    } catch (e) {
      setAviso({ tipo: 'erro', txt: e.message || 'Não foi possível gerar o PDF.' })
    }
  }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Planos de ação · acompanhar</div>
          <h1>O que cada coordenador entregou e o que falta.</h1>
          <p className="muted">Escolha um coordenador (ou um curso) para ver o gabarito. Só conta como entregue o plano <b>enviado</b> para a análise.</p>
        </div>
      </section>
      <div className="ac-legenda">
        {Object.entries(ESTADO_CELULA).map(([k, v]) => <span key={k} className={'ac-cel ' + k}>{ICONE[k]} {v.t}</span>)}
      </div>
      {aviso && <div className={'aviso ' + aviso.tipo} role="status" onClick={() => setAviso(null)}>{aviso.txt}</div>}

      <div className="ac-grade">
        <aside className="card ac-lista" aria-label="Escolha">
          <div className="seg" role="group" aria-label="Ver por">
            <button aria-pressed={modo === 'coord'} onClick={() => { setModo('coord'); setSel('') }}>Por coordenador</button>
            <button aria-pressed={modo === 'curso'} onClick={() => { setModo('curso'); setSel('') }}>Por curso</button>
          </div>
          <label className="sr-only" htmlFor="ac-busca">Buscar</label>
          <input id="ac-busca" type="search" className="input" placeholder={modo === 'coord' ? 'Buscar coordenador' : 'Buscar curso'} value={busca} onChange={(e) => setBusca(e.target.value)} />
          <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={soPend} onChange={(e) => setSoPend(e.target.checked)} /> Só com pendência ({comPend} de {lista.length})
          </label>
          <div className="ac-itens">
            {!visiveis.length && <p className="small muted">Ninguém neste filtro.</p>}
            {visiveis.map((x) => (
              <button key={x.k} type="button" className={'ac-item' + (sel === x.k ? ' sel' : '')} onClick={() => { setSel(x.k); setFiltro('todos') }}>
                <span className="ac-nome">{x.nome}</span>
                <span className={'ac-pend' + (x.pend ? '' : ' zero')}>{x.pend ? `${x.pend} pend.` : '✓ ok'}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="ac-painel">
          {!atual ? (
            <Vazio>{modo === 'coord' ? 'Escolha um coordenador na lista para ver o gabarito dele.' : 'Escolha um curso na lista para ver o gabarito dele.'}</Vazio>
          ) : (
            <Gabarito
              x={atual} modo={modo} filtro={filtro} setFiltro={setFiltro} nomeDe={nomeDe} coordsDoCurso={coordsDoCurso}
              onPdf={baixarPdf} pessoas={pessoas}
            />
          )}
        </div>
      </div>
    </>
  )
}

function Gabarito({ x, modo, filtro, setFiltro, nomeDe, coordsDoCurso, onPdf, pessoas }) {
  const { cob } = x
  const [copiado, setCopiado] = useState('')
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagemCobranca(x.nome, cob, modalidade))
      setCopiado(x.k)
      setTimeout(() => setCopiado(''), 2500)
    } catch {
      setCopiado('')
    }
  }
  const conta = { ok: 0, nao_enviado: 0, devolvido: 0, falta: 0 }
  for (const l of cob.linhas) for (const d of CATEGORIAS_PLANO) conta[l.estado[d]]++
  const linhas = cob.linhas.filter((l) => filtro === 'todos' || (filtro === 'pendentes' ? l.faltam.length : !l.faltam.length))
  const pendentes = cob.linhas.filter((l) => l.faltam.length)
  // No modo curso, os coordenadores do curso (para gerar o PDF de cada um)
  const coordsCurso = modo === 'curso' ? pessoas.filter((p) => cob.linhas.some((l) => p.cob.linhas.some((m) => m.curso.id === l.curso.id))) : []

  return (
    <section className="card" style={{ gap: 14 }}>
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">{modo === 'coord' ? 'Coordenador' : 'Curso'} · {fmtInt(cob.total)} {cob.total === 1 ? 'curso/modalidade' : 'cursos/modalidades'}</span>
          <h2 style={{ fontSize: 24 }}>{x.nome}</h2>
        </div>
        <div className="spacer" />
        {modo === 'coord' && <button className="btn" onClick={copiar}>{copiado === x.k ? 'Mensagem copiada ✓' : 'Copiar mensagem'}</button>}
        {modo === 'coord' && <button className="btn escuro" onClick={() => onPdf(x.pessoa, cob)}>Baixar PDF de pendências</button>}
        {modo === 'curso' && coordsCurso.map((p) => <button key={p.u.id} className="btn sm" onClick={() => onPdf(p.u, p.cob)}>PDF · {p.u.nome}</button>)}
      </div>
      <div className="chips" style={{ gap: 6 }}>
        <span className="ac-cel ok">✓ {conta.ok} enviados</span>
        <span className="ac-cel nao_enviado">✎ {conta.nao_enviado} escritos, não enviados</span>
        <span className="ac-cel devolvido">↩ {conta.devolvido} devolvidos</span>
        <span className="ac-cel falta">✗ {conta.falta} faltando</span>
      </div>
      <div className="seg" role="group" aria-label="Filtro" style={{ alignSelf: 'flex-start' }}>
        {FILTROS.map(([k, t]) => (
          <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            {t} ({k === 'todos' ? cob.linhas.length : k === 'pendentes' ? pendentes.length : cob.linhas.length - pendentes.length})
          </button>
        ))}
      </div>

      {!linhas.length ? (
        <Vazio>{filtro === 'pendentes' ? 'Nenhum curso com pendência. Tudo enviado!' : 'Nenhum curso neste filtro.'}</Vazio>
      ) : (
        <div className="cob-rolagem">
          <table className="ac-tabela">
            <thead>
              <tr>
                <th scope="col" className="ac-col-curso">Curso · modalidade</th>
                {CATEGORIAS_PLANO.map((d) => <th key={d} scope="col" title={d}>{CURTO_DIM[d] || d}</th>)}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.curso.id}>
                  <th scope="row" className="ac-col-curso">
                    <b>{nomeCurso(l.curso)}</b>
                    <span className="small muted">{modalidade(l.curso)}{modo === 'curso' ? ` · ${coordsDoCurso(l.curso.id).join(', ') || 'sem coordenador vinculado'}` : ''}</span>
                  </th>
                  {CATEGORIAS_PLANO.map((d) => {
                    const e = l.estado[d]
                    return (
                      <td key={d} title={`${nomeCurso(l.curso)} (${modalidade(l.curso)}) · ${d}: ${ESTADO_CELULA[e].t}`}>
                        <span className={'ac-cel ' + e}>{ICONE[e]}{e === 'ok' && l.enviadosDim[d] > 1 ? ' ' + l.enviadosDim[d] : ''}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtro !== 'concluidos' && pendentes.length > 0 && (
        <details className="ac-detalhe" open={pendentes.reduce((s, l) => s + l.faltam.length, 0) <= 6}>
          <summary><b>O que fazer, curso a curso ({pendentes.reduce((s, l) => s + l.faltam.length, 0)} pendências)</b></summary>
          {pendentes.map((l) => (
            <div key={l.curso.id} className="ac-curso-pend">
              <b>{nomeCurso(l.curso)} · {modalidade(l.curso)}</b>
              <ul>
                {l.faltam.map((d) => (
                  <li key={d}><span className={'ac-cel ' + l.estado[d]}>{ICONE[l.estado[d]]} {d}</span> {acaoPendente(l.estado[d], l.planosDim[d], nomeDe)}</li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}
    </section>
  )
}
