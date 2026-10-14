// Gabarito dos planos por curso e modelo de oferta: quem já enviou, o que foi devolvido e o que aconteceu
// depois (ajustado, resolvido ou ainda esperando), com o coordenador de cada curso e um recado pronto para copiar.
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtInt } from '../lib/cpa.js'
import { coordenadoresDoCurso, devolvidoAoCoordenador, retornoDaDevolucao, situacaoDe, urgencia, useVinculos } from '../lib/planos.js'
import ItemPlano from './ItemPlano.jsx'
import { Vazio } from './ui.jsx'

const MODS = ['PRESENCIAL', 'EAD', 'SEMIPRESENCIAL']
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

// Situação do curso, da pendência do coordenador para a da CPA
function situacaoCurso(l) {
  if (!l.planos.length) return { k: 'sem_plano', t: 'Falta enviar o plano', c: 'laranja', coord: true }
  if (l.n.aguardando) return { k: 'ajustar', t: `Falta ajustar ${plural(l.n.aguardando, 'devolvido', 'devolvidos')}`, c: 'laranja', coord: true }
  if (l.n.revisar) return { k: 'revisar', t: `Falta o coordenador revisar ${l.n.revisar}`, c: 'laranja', coord: true }
  if (l.n.cpa) return { k: 'cpa', t: `Com a CPA · ${l.n.cpa} para analisar`, c: 'azul' }
  if (l.n.pr) return { k: 'pr', t: `Com a Pró-Reitoria · ${l.n.pr}`, c: 'azul' }
  return { k: 'ok', t: 'Em dia', c: 'verde' }
}

function recado(l, coord) {
  const curso = `${l.curso.nome} (${MODALIDADE_LABEL[l.curso.modalidade] || l.curso.modalidade})`
  const ola = coord ? `Olá, ${coord.nome.split(' ')[0]}! ` : 'Olá! '
  if (l.sit.k === 'sem_plano') return `${ola}No Portal CPA, o curso ${curso} ainda não tem plano de melhoria enviado. Pode registrar em Planos de ação?`
  if (l.sit.k === 'ajustar') return `${ola}No Portal CPA, o curso ${curso} tem ${plural(l.n.aguardando, 'plano de melhoria devolvido', 'planos de melhoria devolvidos')} esperando o seu ajuste. O comentário da CPA está em cada plano, em Planos de ação. Se a ação já foi feita, use "Já resolvi".`
  if (l.sit.k === 'revisar') return `${ola}No Portal CPA, o curso ${curso} tem ${plural(l.n.revisar, 'plano de melhoria da equipe', 'planos de melhoria da equipe')} esperando a sua revisão, em Planos de ação → Planos da equipe.`
  return null
}

export default function PlanoGabarito({ perfil, base, mudou }) {
  const { lista: vinculos, erro } = useVinculos()
  const [mod, setMod] = useState('')
  const [coordId, setCoordId] = useState('')
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(null)
  const [copiado, setCopiado] = useState(null)

  const linhas = useMemo(() => {
    const porCurso = {}
    for (const p of base.planos) if (p.tipo !== 'setor' && p.curso_id) (porCurso[p.curso_id] ||= []).push(p)
    return base.cursos.map((c) => {
      const planos = porCurso[c.id] || []
      const n = { aguardando: 0, ajustado: 0, resolvido: 0, revisar: 0, cpa: 0, pr: 0, ok: 0 }
      for (const p of planos) {
        const r = retornoDaDevolucao(p)
        if (r) n[r]++
        const st = situacaoDe(p)
        if (st === 'aguardando_coordenador' && !devolvidoAoCoordenador(p)) n.revisar++
        if (st === 'enviado') n.cpa++
        if (st === 'aguardando_pro_reitoria') n.pr++
        if (['aprovado', 'concluido'].includes(st)) n.ok++
      }
      const l = { curso: c, planos, n, coords: coordenadoresDoCurso(c.id, vinculos, base) }
      l.sit = situacaoCurso(l)
      return l
    })
  }, [base, vinculos])

  if (erro) return <div className="aviso erro">Não foi possível ler os coordenadores de cada curso: {erro}</div>
  if (!vinculos) return <div className="card"><span className="muted">Carregando os cursos e os coordenadores…</span></div>

  const coordenadores = [...new Map(linhas.flatMap((l) => l.coords).map((u) => [u.id, u])).values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const naMod = linhas.filter((l) => !mod || l.curso.modalidade === mod)
  const soma = (k) => naMod.reduce((s, l) => s + l.n[k], 0)
  const cursosCom = (k) => naMod.filter((l) => l.n[k] > 0).length
  const quadros = [
    { k: 'sem_plano', q: naMod.filter((l) => !l.planos.length).length, t: 'cursos sem nenhum plano', c: 'laranja' },
    { k: 'aguardando', q: soma('aguardando'), t: `devolvidos esperando ajuste · ${plural(cursosCom('aguardando'), 'curso', 'cursos')}`, c: 'laranja' },
    { k: 'revisar', q: soma('revisar'), t: `da equipe esperando o coordenador · ${plural(cursosCom('revisar'), 'curso', 'cursos')}`, c: 'laranja' },
    { k: 'ajustado', q: soma('ajustado'), t: `devolvidos que voltaram ajustados · ${plural(cursosCom('ajustado'), 'curso', 'cursos')}`, c: 'azul' },
    { k: 'resolvido', q: soma('resolvido'), t: `devolvidos que o coordenador marcou como já resolvidos`, c: 'verde' },
    { k: 'ok', q: naMod.filter((l) => l.sit.k === 'ok').length, t: 'cursos em dia', c: 'verde' },
  ]
  const passaFiltro = (l) => {
    if (!filtro) return true
    if (filtro === 'sem_plano') return !l.planos.length
    if (filtro === 'pendencia') return l.sit.coord
    if (filtro === 'ok') return l.sit.k === 'ok'
    return l.n[filtro] > 0
  }
  const termo = busca.trim().toLowerCase()
  const visiveis = naMod
    .filter((l) => !coordId || l.coords.some((u) => u.id === coordId))
    .filter(passaFiltro)
    .filter((l) => !termo || l.curso.nome.toLowerCase().includes(termo) || l.coords.some((u) => u.nome.toLowerCase().includes(termo)))
    .sort((a, b) => (b.sit.coord ? 1 : 0) - (a.sit.coord ? 1 : 0) || a.curso.nome.localeCompare(b.curso.nome, 'pt-BR') || MODS.indexOf(a.curso.modalidade) - MODS.indexOf(b.curso.modalidade))
  const pendCoord = naMod.filter((l) => l.sit.coord).length

  const copiar = async (l, coord) => {
    const t = recado(l, coord)
    try {
      await navigator.clipboard.writeText(t)
      setCopiado(l.curso.id + (coord?.id || ''))
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      window.prompt('Copie o recado:', t)
    }
  }

  return (
    <>
      <section className="card" style={{ gap: 12 }}>
        <span className="eyebrow">Gabarito dos planos de melhoria</span>
        <h3 style={{ fontSize: 22 }}>{pendCoord ? `${plural(pendCoord, 'curso', 'cursos')} com pendência do coordenador` : 'Nenhum curso com pendência do coordenador'}</h3>
        <p className="small muted">Cada linha é um curso num modelo de oferta. Clique num quadro para filtrar. Os planos devolvidos guardam o comentário da CPA, então dá para ver o que voltou ajustado e o que o coordenador marcou como já resolvido.</p>
        <div className="seg" role="group" aria-label="Modelo de oferta">
          {[['', 'Todos'], ...MODS.map((m) => [m, MODALIDADE_LABEL[m]])].map(([k, t]) => (
            <button key={k} aria-pressed={mod === k} onClick={() => setMod(k)}>{t}</button>
          ))}
        </div>
        <div className="gab-quadros">
          {quadros.map((x) => (
            <button key={x.k} type="button" className={'gab-quadro ' + x.c} aria-pressed={filtro === x.k} onClick={() => setFiltro(filtro === x.k ? '' : x.k)}>
              <span className="q">{fmtInt(x.q)}</span>
              <span className="t">{x.t}</span>
            </button>
          ))}
        </div>
        <div className="filtros">
          <label className="sr-only" htmlFor="gab-coord">Coordenador</label>
          <select id="gab-coord" className="input" value={coordId} onChange={(e) => setCoordId(e.target.value)} style={{ minWidth: 240 }}>
            <option value="">Todos os coordenadores</option>
            {coordenadores.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <label className="sr-only" htmlFor="gab-busca">Buscar curso</label>
          <input id="gab-busca" type="search" className="input" placeholder="Buscar curso ou coordenador" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <button type="button" className="chip-btn" aria-pressed={filtro === 'pendencia'} onClick={() => setFiltro(filtro === 'pendencia' ? '' : 'pendencia')}>Só com pendência do coordenador</button>
          {(filtro || coordId || busca) && <button className="btn sm" onClick={() => { setFiltro(''); setCoordId(''); setBusca('') }}>Limpar</button>}
          <span className="small muted">{fmtInt(visiveis.length)} de {fmtInt(naMod.length)} cursos</span>
        </div>
      </section>

      <section className="card" style={{ gap: 0, padding: 0 }}>
        {visiveis.length === 0 && <div style={{ padding: 20 }}><Vazio>Nenhum curso neste filtro.</Vazio></div>}
        {visiveis.length > 0 && (
          <div className="cob-rolagem">
            <table className="gab-tabela">
              <thead>
                <tr>
                  <th scope="col">Curso · modelo de oferta</th>
                  <th scope="col">Coordenador</th>
                  <th scope="col">Planos</th>
                  <th scope="col">Devolvidos: o que aconteceu</th>
                  <th scope="col">Situação</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => {
                  const abre = aberto === l.curso.id
                  const temRecado = !!recado(l, null)
                  return [
                    <tr key={l.curso.id} className={l.sit.coord ? 'pend' : ''}>
                      <th scope="row">
                        <b>{l.curso.nome}</b>
                        <span className={'gab-mod m-' + l.curso.modalidade}>{MODALIDADE_LABEL[l.curso.modalidade] || l.curso.modalidade}</span>
                      </th>
                      <td>{l.coords.length ? l.coords.map((u) => <span key={u.id} className="gab-coord">{u.nome}</span>) : <span className="small muted">sem coordenador vinculado</span>}</td>
                      <td className="num">{l.planos.length || '—'}</td>
                      <td>
                        <div className="chips" style={{ gap: 4 }}>
                          {l.n.aguardando > 0 && <span className="selo laranja">{l.n.aguardando} esperando ajuste</span>}
                          {l.n.ajustado > 0 && <span className="selo azul">{l.n.ajustado} ajustado{l.n.ajustado > 1 ? 's' : ''} e reenviado{l.n.ajustado > 1 ? 's' : ''}</span>}
                          {l.n.resolvido > 0 && <span className="selo verde">{l.n.resolvido} já resolvido{l.n.resolvido > 1 ? 's' : ''}</span>}
                          {!l.n.aguardando && !l.n.ajustado && !l.n.resolvido && <span className="small muted">—</span>}
                        </div>
                      </td>
                      <td><span className={'selo ' + l.sit.c}>{l.sit.t}</span></td>
                      <td className="acoes">
                        {l.planos.length > 0 && <button className="btn sm" aria-expanded={abre} onClick={() => setAberto(abre ? null : l.curso.id)}>{abre ? 'Fechar' : 'Ver planos'}</button>}
                        {temRecado && (l.coords.length ? l.coords : [null]).map((u) => (
                          <button key={u?.id || 'x'} className="btn sm" onClick={() => copiar(l, u)} title={recado(l, u)}>
                            {copiado === l.curso.id + (u?.id || '') ? 'Copiado ✓' : l.coords.length > 1 ? `Copiar recado · ${u.nome.split(' ')[0]}` : 'Copiar recado'}
                          </button>
                        ))}
                      </td>
                    </tr>,
                    abre && (
                      <tr key={l.curso.id + '-planos'} className="gab-planos">
                        <td colSpan={6}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[...l.planos].sort((a, b) => urgencia(a) - urgencia(b)).map((p) => <ItemPlano key={p.id} p={p} perfil={perfil} base={base} onMudou={mudou} />)}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
