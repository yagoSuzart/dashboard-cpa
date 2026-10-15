// Cobrar coordenador: escolhe um coordenador e vê, curso a curso e dimensão a dimensão, o que foi ENVIADO,
// o que está escrito mas não foi enviado, o que voltou devolvido e o que falta. Filtro Todos / Pendentes /
// Concluídos e uma mensagem pronta para mandar no privado.
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtInt } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, fmtData, rotuloStatus, useVinculos } from '../lib/planos.js'
import { ESTADO_CELULA, calcularCobertura, nomeCurso, ordCurso, planosDaCobertura, situacaoEnvio } from '../lib/cobertura.js'
import { Vazio } from './ui.jsx'

const FILTROS = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['concluidos', 'Concluídos']]
const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || ''

export default function PlanoCobranca({ base }) {
  const { lista: vinculos, erro } = useVinculos()
  const [pessoaId, setPessoaId] = useState('')
  const [filtro, setFiltro] = useState('pendentes')
  const [copiado, setCopiado] = useState(false)
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])

  // Todos os coordenadores com a contagem de pendências (para a lista de escolha)
  const pessoas = useMemo(() => {
    if (!vinculos) return []
    const cursosDe = {}
    for (const v of vinculos) (cursosDe[v.usuario_id] ||= []).push(v.curso_id)
    return base.usuarios
      .filter((u) => u.role === 'coordenador' && cursosDe[u.id]?.length)
      .map((u) => {
        const ids = [...new Set(cursosDe[u.id])]
        const cursos = ids.map((id) => porCurso[id] || { id, nome: id, modalidade: '' }).sort(ordCurso)
        const cob = calcularCobertura(cursos, planosDaCobertura(base, u.id, ids))
        const pend = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
        return { u, cob, pend }
      })
      .sort((a, b) => b.pend - a.pend || a.u.nome.localeCompare(b.u.nome, 'pt-BR'))
  }, [vinculos, base, porCurso])

  if (erro) return <div className="aviso erro" role="alert">Não foi possível carregar os cursos de cada coordenador: {erro}</div>
  if (!vinculos) return <div className="card"><span className="muted">Carregando os coordenadores…</span></div>

  const sel = pessoas.find((x) => x.u.id === pessoaId)
  const comPend = pessoas.filter((x) => x.pend > 0)
  const autorNome = (id) => base.usuarios.find((u) => u.id === id)?.nome || '—'

  // Itens curso × dimensão do coordenador escolhido
  const itens = sel
    ? sel.cob.linhas.flatMap((l) => CATEGORIAS_PLANO.map((d) => ({ l, d, e: l.estado[d], planos: l.planosDim[d] })))
    : []
  const conta = { ok: 0, nao_enviado: 0, devolvido: 0, falta: 0 }
  for (const it of itens) conta[it.e]++
  const visiveis = itens.filter((it) => filtro === 'todos' || (filtro === 'pendentes' ? it.e !== 'ok' : it.e === 'ok'))
  const porCursoSel = new Map()
  for (const it of visiveis) {
    if (!porCursoSel.has(it.l.curso.id)) porCursoSel.set(it.l.curso.id, { l: it.l, itens: [] })
    porCursoSel.get(it.l.curso.id).itens.push(it)
  }

  const mensagem = () => {
    if (!sel) return ''
    const pend = itens.filter((it) => it.e !== 'ok')
    if (!pend.length) return `Olá, ${primeiroNome(sel.u.nome)}! Conferi no Portal da CPA e todos os seus planos de ação já foram enviados. Obrigado!`
    const bloco = (e, titulo) => {
      const xs = pend.filter((it) => it.e === e)
      if (!xs.length) return ''
      return `\n${titulo}\n` + xs.map((it) => `• ${nomeCurso(it.l.curso)} (${modalidade(it.l.curso)}) · ${it.d}`).join('\n') + '\n'
    }
    return `Olá, ${primeiroNome(sel.u.nome)}! Tudo bem? Conferi no Portal da CPA os planos de ação dos seus cursos e ainda há pendências:\n` +
      bloco('falta', 'Ainda sem plano:') +
      bloco('nao_enviado', 'Escritos, mas ainda não enviados para a análise (pode ser plano do auxiliar esperando a sua aprovação e envio):') +
      bloco('devolvido', 'Devolvidos com comentário, faltando ajustar e reenviar:') +
      `\nSe você já escreveu algum destes, confira se clicou em enviar: plano escrito e não enviado não chega para a CPA aprovar. Qualquer dúvida, estou à disposição.`
  }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <>
      <section className="card" style={{ gap: 12 }}>
        <span className="eyebrow">Cobrar coordenador</span>
        <h2 style={{ fontSize: 22 }}>Escolha um coordenador para ver o que falta</h2>
        <p className="small muted">Só conta como entregue o plano <b>enviado</b> para a análise. Plano escrito e parado (ex.: do auxiliar, esperando o coordenador aprovar e enviar) e plano devolvido aparecem como pendência.</p>
        <div className="filtros">
          <label className="small" htmlFor="cb-pessoa" style={{ fontWeight: 700 }}>Coordenador</label>
          <select id="cb-pessoa" className="input" style={{ height: 40, fontSize: 14, minWidth: 320, flex: 1, maxWidth: 520 }} value={pessoaId} onChange={(e) => { setPessoaId(e.target.value); setCopiado(false) }}>
            <option value="">Escolha…</option>
            {comPend.length > 0 && (
              <optgroup label={`Com pendências (${comPend.length})`}>
                {comPend.map((x) => <option key={x.u.id} value={x.u.id}>{x.u.nome} · {x.pend} {x.pend === 1 ? 'pendência' : 'pendências'}</option>)}
              </optgroup>
            )}
            <optgroup label="Tudo enviado">
              {pessoas.filter((x) => !x.pend).map((x) => <option key={x.u.id} value={x.u.id}>{x.u.nome} · tudo enviado</option>)}
            </optgroup>
          </select>
          <span className="small muted">{fmtInt(comPend.length)} de {fmtInt(pessoas.length)} coordenadores com pendência</span>
        </div>
      </section>

      {!sel && <Vazio>Escolha um coordenador na lista para ver as pendências dele.</Vazio>}
      {sel && (
        <section className="card" style={{ gap: 14 }}>
          <div className="card-h">
            <div className="t">
              <span className="eyebrow">{fmtInt(sel.cob.total)} {sel.cob.total === 1 ? 'curso' : 'cursos'} · {fmtInt(itens.length)} itens (curso × dimensão)</span>
              <h3 style={{ fontSize: 22 }}>{sel.u.nome}</h3>
            </div>
            <div className="spacer" />
            <button className="btn escuro" onClick={copiar}>{copiado ? 'Mensagem copiada ✓' : 'Copiar mensagem de cobrança'}</button>
          </div>
          <div className="chips" style={{ gap: 6 }}>
            <span className="selo verde">{conta.ok} enviados</span>
            <span className="selo roxo">{conta.nao_enviado} escritos, não enviados</span>
            <span className="selo laranja">{conta.devolvido} devolvidos</span>
            <span className="selo vermelho cb-falta">{conta.falta} faltando</span>
          </div>
          <div className="seg" role="group" aria-label="Filtro" style={{ alignSelf: 'flex-start' }}>
            {FILTROS.map(([k, t]) => (
              <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
                {t} ({k === 'todos' ? itens.length : k === 'pendentes' ? itens.length - conta.ok : conta.ok})
              </button>
            ))}
          </div>
          {!visiveis.length && <Vazio>{filtro === 'pendentes' ? 'Nenhuma pendência. Tudo enviado!' : 'Nada neste filtro.'}</Vazio>}
          {[...porCursoSel.values()].map(({ l, itens: xs }) => (
            <div key={l.curso.id} className="cb-curso">
              <b>{nomeCurso(l.curso)} · {modalidade(l.curso)}</b>
              <div className="cb-lista">
                {xs.map((it) => (
                  <div key={it.d} className={'cb-item ' + it.e}>
                    <span className={'selo ' + (it.e === 'falta' ? 'vermelho cb-falta' : ESTADO_CELULA[it.e].c)}>{ESTADO_CELULA[it.e].t}</span>
                    <span className="cb-dim">{it.d}</span>
                    {it.planos.length > 0 && (
                      <span className="small muted cb-planos">
                        {it.planos.map((p) => `“${p.titulo}” · ${autorNome(p.usuario_id)} · ${situacaoEnvio(p) === 'enviado' ? rotuloStatus(p) : situacaoEnvio(p) === 'devolvido' ? 'devolvido' + (p.revisado_em ? ' em ' + fmtData(p.revisado_em) : '') : 'parado antes do envio'}`).join('  |  ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
