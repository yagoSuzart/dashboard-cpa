// Acompanhar: só os gabaritos de entrega dos planos de ação. Um coordenador (ou um curso) por vez, para a tela
// não pesar. Linhas = cursos (curso + modalidade de oferta), colunas = questionários; cada célula mostra se o
// plano foi enviado, está escrito e parado, voltou devolvido, falta ou precisa ser confirmado. Gera o PDF de
// pendências para o coordenador sempre com os dados recarregados do banco naquele momento (margem de segurança).
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtInt } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, carregarVinculos, rotuloStatus, useVinculos } from '../lib/planos.js'
import {
  CURTO_DIM, ESTADO_CELULA, acaoPendente, calcularCobertura, coberturaPorCoordenador, mensagemCobranca, nomeCurso,
  ordCurso, situacaoEnvio, textoIndicio,
} from '../lib/cobertura.js'
import { Vazio } from '../components/ui.jsx'
import './planos.css'

const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const ICONE = { ok: '✓', nao_enviado: '✎', devolvido: '↩', falta: '✗', conferir: '?' }
const FILTROS = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['concluidos', 'Concluídos']]
const hora = (d) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const dataBR = (s) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—')

// Cobertura por curso (todas as modalidades, todos os autores)
function coberturaPorCurso(base) {
  const grupos = new Map()
  for (const c of [...base.cursos].sort(ordCurso)) {
    const k = nomeCurso(c)
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(c)
  }
  return [...grupos.entries()].map(([nome, cs]) => {
    const ids = new Set(cs.map((c) => c.id))
    const cob = calcularCobertura(cs, base.planos.filter((p) => p.tipo !== 'setor' && ids.has(p.curso_id)), { referencia: base.planos, todosCursos: base.cursos })
    const pend = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
    return { k: nome, nome, cob, pend }
  }).sort((a, b) => b.pend - a.pend || a.nome.localeCompare(b.nome, 'pt-BR'))
}

export default function Acompanhar({ base, recarregarBase }) {
  const { lista: vinculos, erro } = useVinculos()
  const [modo, setModo] = useState('coord')
  const [busca, setBusca] = useState('')
  const [soPend, setSoPend] = useState(true)
  const [sel, setSel] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [aviso, setAviso] = useState(null)
  const [conferido, setConferido] = useState(() => new Date())
  const [atualizando, setAtualizando] = useState(false)

  const pessoas = useMemo(() => coberturaPorCoordenador(base, vinculos), [base, vinculos])
  const cursos = useMemo(() => (vinculos ? coberturaPorCurso(base) : []), [base, vinculos])

  if (erro) return <div className="aviso erro" role="alert">Não foi possível carregar os vínculos de coordenadores e cursos: {erro}</div>
  if (!vinculos) return <div className="card"><span className="muted">Carregando os coordenadores e cursos…</span></div>

  const lista = modo === 'coord'
    ? pessoas.map((x) => ({ k: x.u.id, nome: x.u.nome, pend: x.pend, conf: x.cob.aConferir, cob: x.cob, pessoa: x.u }))
    : cursos.map((x) => ({ k: x.k, nome: x.nome, pend: x.pend, conf: x.cob.aConferir, cob: x.cob }))
  const termo = busca.trim().toLowerCase()
  const visiveis = lista.filter((x) => (!soPend || x.pend > 0 || x.conf > 0) && (!termo || x.nome.toLowerCase().includes(termo)))
  const atual = lista.find((x) => x.k === sel)
  const comPend = lista.filter((x) => x.pend > 0 || x.conf > 0).length

  const coordsDoCurso = (cid) => {
    const ids = new Set(vinculos.filter((v) => v.curso_id === cid).map((v) => v.usuario_id))
    return base.usuarios.filter((u) => ids.has(u.id) && u.role === 'coordenador').map((u) => u.nome)
  }
  const atualizar = async () => {
    setAtualizando(true)
    try {
      await Promise.all([recarregarBase?.(), carregarVinculos(true)])
      setConferido(new Date())
      setAviso({ tipo: 'ok', txt: 'Dados atualizados agora.' })
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível atualizar: ' + (e.message || e) })
    } finally {
      setAtualizando(false)
    }
  }
  // O PDF sai sempre com os dados recarregados do banco neste instante, nunca com o que estava na tela
  const baixarPdf = async (pessoa, pendNaTela) => {
    setAviso({ tipo: '', txt: 'Conferindo os dados mais recentes e gerando o PDF…' })
    try {
      const [nova, vs] = await Promise.all([recarregarBase ? recarregarBase() : Promise.resolve(base), carregarVinculos(true)])
      const agora = new Date()
      setConferido(agora)
      const x = coberturaPorCoordenador(nova || base, vs).find((p) => p.u.id === pessoa.id)
      if (!x) throw new Error('Este coordenador não tem mais cursos vinculados.')
      const pdf = await import('../lib/pdf.js')
      const msg = await pdf.baixarPdfPendencias({ base: nova || base, pessoa, cob: x.cob, conferidoEm: agora })
      const mudou = x.pend !== pendNaTela ? ` Atenção: os dados mudaram desde que a tela foi aberta (eram ${pendNaTela} pendências, agora são ${x.pend}). O PDF saiu com os dados de agora.` : ''
      setAviso({ tipo: mudou ? '' : 'ok', txt: msg + mudou })
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
      <div className="ac-topo">
        <div className="ac-legenda">
          {Object.entries(ESTADO_CELULA).map(([k, v]) => <span key={k} className={'ac-cel ' + k}>{ICONE[k]} {k === 'conferir' ? 'A confirmar (não é pendência)' : v.t}</span>)}
        </div>
        <div className="ac-conferido">
          <span className="small muted">Dados de {hora(conferido)}</span>
          <button className="btn sm" onClick={atualizar} disabled={atualizando}>{atualizando ? 'Atualizando…' : 'Atualizar dados'}</button>
        </div>
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
                <span className="ac-selos">
                  {x.conf > 0 && <span className="ac-pend conf" title="Itens a confirmar">{x.conf} ?</span>}
                  <span className={'ac-pend' + (x.pend ? '' : ' zero')}>{x.pend ? `${x.pend} pend.` : '✓ ok'}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="ac-painel">
          {!atual ? (
            <Vazio>{modo === 'coord' ? 'Escolha um coordenador na lista para ver o gabarito dele.' : 'Escolha um curso na lista para ver o gabarito dele.'}</Vazio>
          ) : (
            <Gabarito x={atual} modo={modo} filtro={filtro} setFiltro={setFiltro} base={base} coordsDoCurso={coordsDoCurso} onPdf={baixarPdf} pessoas={pessoas} />
          )}
        </div>
      </div>
    </>
  )
}

function Gabarito({ x, modo, filtro, setFiltro, base, coordsDoCurso, onPdf, pessoas }) {
  const { cob } = x
  const [copiado, setCopiado] = useState('')
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagemCobranca(x.nome, cob, modalidade))
      setCopiado(x.k)
      setTimeout(() => setCopiado(''), 2500)
    } catch {
      setCopiado('')
    }
  }
  const conta = { ok: 0, nao_enviado: 0, devolvido: 0, falta: 0, conferir: 0 }
  for (const l of cob.linhas) for (const d of CATEGORIAS_PLANO) conta[l.estado[d]]++
  const temAlgo = (l) => l.faltam.length || l.conferir.length
  const nPend = cob.linhas.filter(temAlgo).length
  const linhas = cob.linhas.filter((l) => filtro === 'todos' || (filtro === 'pendentes' ? temAlgo(l) : !temAlgo(l)))
  const pendentes = cob.linhas.filter((l) => l.faltam.length)
  const aConferir = cob.linhas.filter((l) => l.conferir.length)
  const totalPend = pendentes.reduce((s, l) => s + l.faltam.length, 0)
  const recebidos = cob.linhas.flatMap((l) => CATEGORIAS_PLANO.flatMap((d) => l.planosDim[d].filter((p) => situacaoEnvio(p) === 'enviado').map((p) => ({ l, d, p }))))
  // No modo curso, os coordenadores do curso (para gerar o PDF de cada um)
  const coordsCurso = modo === 'curso' ? pessoas.filter((p) => cob.linhas.some((l) => p.cob.linhas.some((m) => m.curso.id === l.curso.id))) : []
  const dica = (l, d) => {
    const e = l.estado[d]
    const t = `${nomeCurso(l.curso)} (${modalidade(l.curso)}) · ${d}: ${ESTADO_CELULA[e].t}`
    const ps = e === 'conferir' ? l.indicios[d] : l.planosDim[d]
    return ps.length ? t + '\n' + ps.map((p) => `• “${p.titulo}” · ${nomeDe(p.usuario_id)} · ${rotuloStatus(p)}`).join('\n') : t
  }

  return (
    <section className="card" style={{ gap: 14 }}>
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">{modo === 'coord' ? 'Coordenador' : 'Curso'} · {fmtInt(cob.total)} {cob.total === 1 ? 'curso/modalidade' : 'cursos/modalidades'}</span>
          <h2 style={{ fontSize: 24 }}>{x.nome}</h2>
        </div>
        <div className="spacer" />
        {modo === 'coord' && <button className="btn" onClick={copiar}>{copiado === x.k ? 'Mensagem copiada ✓' : 'Copiar mensagem'}</button>}
        {modo === 'coord' && <button className="btn escuro" onClick={() => onPdf(x.pessoa, x.pend)}>Baixar PDF de pendências</button>}
        {modo === 'curso' && coordsCurso.map((p) => <button key={p.u.id} className="btn sm" onClick={() => onPdf(p.u, p.pend)}>PDF · {p.u.nome}</button>)}
      </div>
      <div className="chips" style={{ gap: 6 }}>
        <span className="ac-cel ok">✓ {conta.ok} enviados</span>
        <span className="ac-cel nao_enviado">✎ {conta.nao_enviado} escritos, não enviados</span>
        <span className="ac-cel devolvido">↩ {conta.devolvido} devolvidos</span>
        <span className="ac-cel falta">✗ {conta.falta} faltando</span>
        {conta.conferir > 0 && <span className="ac-cel conferir">? {conta.conferir} a confirmar</span>}
      </div>
      <div className="seg" role="group" aria-label="Filtro" style={{ alignSelf: 'flex-start' }}>
        {FILTROS.map(([k, t]) => (
          <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            {t} ({k === 'todos' ? cob.linhas.length : k === 'pendentes' ? nPend : cob.linhas.length - nPend})
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
                      <td key={d} title={dica(l, d)}>
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

      {filtro !== 'concluidos' && aConferir.length > 0 && (
        <div className="ac-conferir">
          <b>? Confirme antes de cobrar ({conta.conferir})</b>
          <p className="small muted">Não há plano nesta modalidade, mas existe plano <b>enviado</b> do mesmo questionário em outra modalidade do mesmo curso (ou de outra pessoa no curso). Estes itens <b>não</b> contam como pendência; no PDF aparecem como “para confirmar”.</p>
          {aConferir.map((l) => (
            <div key={l.curso.id} className="ac-curso-pend">
              <b>{nomeCurso(l.curso)} · {modalidade(l.curso)}</b>
              <ul>
                {l.conferir.map((d) => <li key={d}><span className="ac-cel conferir">? {d}</span> Há {textoIndicio(l.indicios[d], l.curso, base)}. Vale também para esta modalidade?</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {filtro !== 'concluidos' && pendentes.length > 0 && (
        <details className="ac-detalhe" open={totalPend <= 6}>
          <summary><b>O que fazer, curso a curso ({totalPend} pendências)</b></summary>
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

      {recebidos.length > 0 && (
        <details className="ac-detalhe">
          <summary><b>O que já recebemos ({recebidos.length})</b> <span className="small muted">· a prova do que chegou, também vai no PDF</span></summary>
          <div className="cob-rolagem">
            <table className="ac-tabela ac-recebidos">
              <thead><tr><th className="ac-col-curso">Curso · modalidade</th><th>Questionário</th><th>Plano</th><th>Situação</th><th>Registrado em</th></tr></thead>
              <tbody>
                {recebidos.map(({ l, d, p }) => (
                  <tr key={l.curso.id + d + p.id}>
                    <td className="ac-col-curso">{nomeCurso(l.curso)} · {modalidade(l.curso)}</td>
                    <td>{CURTO_DIM[d] || d}</td>
                    <td style={{ textAlign: 'left' }}>“{p.titulo}”{nomeDe(p.usuario_id) ? <span className="small muted"> · {nomeDe(p.usuario_id)}</span> : null}</td>
                    <td>{rotuloStatus(p)}</td>
                    <td>{dataBR(p.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  )
}
