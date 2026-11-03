// Controle do feedback aos alunos (supervisão): por coordenador e por curso + modalidade, quem já gerou o feedback no
// Portal, quem já enviou/baixou e quem tem itens aprovados mas ainda não gerou nada. Os eventos vêm da tabela
// feedback_eventos, gravada pela tela "Feedback para os alunos".
import { useEffect, useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { useVinculos } from '../lib/planos.js'
import { RESPONDEM_PELO_CURSO, nomeCurso, ordCurso } from '../lib/cobertura.js'
import { carregarEventosFeedback } from '../lib/feedbackControle.js'
import { Carregando, Vazio } from '../components/ui.jsx'
import './planos.css'
import './resultados.css'

const ESTADO = {
  enviado: { t: 'Enviado / baixado', c: 'ok', i: '✓' },
  gerado: { t: 'Gerado, sem envio', c: 'nao_enviado', i: '✎' },
  pendente: { t: 'Não gerou ainda', c: 'falta', i: '!' },
  sem_itens: { t: 'Sem itens aprovados', c: 'cinza', i: '–' },
}
const FILTROS = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['feitos', 'Já geraram']]
const dataHora = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function ControleFeedback({ base }) {
  const { lista: vinculos, erro: erroV } = useVinculos()
  const [eventos, setEventos] = useState(null)
  const [erro, setErro] = useState(null)
  const [filtro, setFiltro] = useState('pendentes')
  const [aberto, setAberto] = useState(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let vivo = true
    carregarEventosFeedback().then((e) => vivo && setEventos(e)).catch((e) => vivo && setErro(e))
    return () => { vivo = false }
  }, [versao])

  const pessoas = useMemo(() => {
    if (!vinculos || !eventos) return []
    const porCurso = Object.fromEntries(base.cursos.map((c) => [c.id, c]))
    const cursosDe = {}
    for (const v of vinculos) (cursosDe[v.usuario_id] ||= new Set()).add(v.curso_id)
    return base.usuarios
      .filter((u) => RESPONDEM_PELO_CURSO.includes(u.role) && cursosDe[u.id]?.size)
      .map((u) => {
        const cursos = [...cursosDe[u.id]].map((id) => porCurso[id]).filter(Boolean).sort(ordCurso).map((c) => {
          const itens = base.planos.filter((p) => p.usuario_id === u.id && p.curso_id === c.id && p.tipo !== 'setor' && (p.status === 'aprovado' || p.status === 'concluido')).length
          const ev = eventos.filter((e) => e.usuario_id === u.id && e.curso_id === c.id)
          const gerou = ev.filter((e) => e.evento === 'gerado')
          const enviou = ev.filter((e) => e.evento !== 'gerado')
          const estado = enviou.length ? 'enviado' : gerou.length ? 'gerado' : itens ? 'pendente' : 'sem_itens'
          const ultimo = ev.length ? ev[ev.length - 1].criado_em : null
          const turmas = [...new Set(ev.map((e) => e.turma).filter(Boolean))]
          return { c, itens, estado, ultimo, turmas, formatos: [...new Set(gerou.map((e) => e.formato))] }
        })
        const comItens = cursos.filter((x) => x.estado !== 'sem_itens').length
        const feitos = cursos.filter((x) => x.estado === 'enviado' || x.estado === 'gerado').length
        return { u, cursos, comItens, feitos, pendentes: cursos.filter((x) => x.estado === 'pendente').length }
      })
      .sort((a, b) => b.pendentes - a.pendentes || a.u.nome.localeCompare(b.u.nome, 'pt-BR'))
  }, [vinculos, eventos, base])

  if (erroV || erro) return <div className="aviso erro" role="alert">Não foi possível carregar o controle do feedback: {erroV || erro?.message}</div>
  if (!vinculos || !eventos) return <Carregando texto="Carregando o controle do feedback…" />

  const todosCursos = pessoas.flatMap((p) => p.cursos)
  const cursosComItens = todosCursos.filter((x) => x.estado !== 'sem_itens').length
  const cursosFeitos = todosCursos.filter((x) => x.estado === 'enviado' || x.estado === 'gerado').length
  const cursosEnviados = todosCursos.filter((x) => x.estado === 'enviado').length
  const coordsComItens = pessoas.filter((p) => p.comItens).length
  const coordsQueGeraram = pessoas.filter((p) => p.feitos).length
  const visiveis = pessoas.filter((p) => filtro === 'todos' || (filtro === 'pendentes' ? p.pendentes : p.feitos))

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Planos de ação · controle do feedback</div>
          <h1>Quem já gerou o feedback para os alunos.</h1>
          <p className="muted">Por coordenador e por curso e modalidade. “Enviado / baixado” = a pessoa tocou em Enviar no WhatsApp, Baixar ou Copiar link no Portal.</p>
        </div>
      </section>

      <section className="res-grid-auto">
        <div className="card res-kpi"><span className="l">Coordenadores que já geraram</span><span className="v grande">{coordsQueGeraram} de {coordsComItens}</span><span className="small muted">com itens aprovados</span></div>
        <div className="card res-kpi"><span className="l">Cursos com feedback gerado</span><span className="v grande">{cursosFeitos} de {cursosComItens}</span><span className="small muted">{cursosEnviados} já enviados ou baixados</span></div>
        <div className="card res-kpi"><span className="l">Cursos sem itens aprovados</span><span className="v grande">{todosCursos.length - cursosComItens}</span><span className="small muted">ainda não entram no feedback</span></div>
      </section>

      <div className="ac-topo">
        <div className="seg" role="group" aria-label="Filtro" style={{ background: 'var(--paper-2)' }}>
          {FILTROS.map(([k, t]) => <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{t}</button>)}
        </div>
        <button className="btn sm" onClick={() => { setEventos(null); setVersao((v) => v + 1) }}>Atualizar dados</button>
      </div>

      <section className="card" style={{ gap: 8 }}>
        {!visiveis.length && <Vazio>{filtro === 'pendentes' ? 'Ninguém com feedback pendente. 🎉' : 'Ninguém neste filtro.'}</Vazio>}
        {visiveis.map((p) => (
          <div key={p.u.id} className="plano-item" style={{ gap: 6 }}>
            <button type="button" className="cf-linha" aria-expanded={aberto === p.u.id} onClick={() => setAberto(aberto === p.u.id ? null : p.u.id)}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{p.u.nome}</b>
                <span className="small muted" style={{ display: 'block' }}>
                  {p.comItens ? `${p.feitos} de ${p.comItens} cursos com itens aprovados já têm feedback` : 'Nenhum curso com itens aprovados ainda'}
                </span>
              </span>
              {p.pendentes > 0 && <span className="ac-cel falta">{p.pendentes} pend.</span>}
              {p.comItens > 0 && !p.pendentes && <span className="ac-cel ok">✓ ok</span>}
              <span className="mp-barra" style={{ width: 120 }} aria-hidden="true"><span style={{ width: `${p.comItens ? (p.feitos / p.comItens) * 100 : 0}%` }} /></span>
            </button>
            {aberto === p.u.id && (
              <ul className="cf-cursos">
                {p.cursos.map((x) => {
                  const e = ESTADO[x.estado]
                  return (
                    <li key={x.c.id}>
                      <span><b>{nomeCurso(x.c)}</b> · {MODALIDADE_LABEL[x.c.modalidade] || x.c.modalidade}<span className="small muted"> · {x.itens} {x.itens === 1 ? 'item aprovado' : 'itens aprovados'}{x.turmas.length ? ` · turmas: ${x.turmas.join(', ')}` : ''}{x.formatos.length ? ` · ${x.formatos.map((f) => (f === 'card' ? 'card-resumo' : 'carrossel')).join(' e ')}` : ''}</span></span>
                      <span className={'ac-cel ' + e.c}>{e.i} {e.t}</span>
                      <span className="small muted">{x.ultimo ? dataHora(x.ultimo) : ''}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </section>
    </>
  )
}
