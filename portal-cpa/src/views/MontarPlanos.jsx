// Montar planos: o lugar do coordenador para fazer os planos de melhoria. Um curso (curso + modalidade) por vez;
// para cada questionário com plano do coordenador mostra a nota, o que já foi feito e o que falta. O card leva para a
// página completa do questionário naquele curso (nota, pontos fortes e a melhorar, comentários), onde o coordenador
// escolhe: montar o plano ou declarar que não há pontos a melhorar.
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtNota } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, rotuloStatus } from '../lib/planos.js'
import { calcularCobertura, nomeCurso, ordCurso, situacaoEnvio } from '../lib/cobertura.js'
import { SeloNota, Vazio } from '../components/ui.jsx'
import './planos.css'

const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const COD = { 'Conteúdo das Disciplinas': 'cd', 'Infraestrutura e Atendimento': 'ia', 'Políticas Acadêmicas': 'pa', 'Políticas de Gestão': 'pg', 'Docência e Tutoria': 'dt' }
const SITUACAO = {
  ok: { t: 'Entregue', c: 'ok', i: '✓' },
  nao_enviado: { t: 'Escrito, falta enviar', c: 'nao_enviado', i: '✎' },
  devolvido: { t: 'Devolvido: ajustar e reenviar', c: 'devolvido', i: '↩' },
  falta: { t: 'Falta montar', c: 'falta', i: '!' },
}

export default function MontarPlanos({ perfil, base, param }) {
  const cursos = useMemo(() => base.cursos.filter((c) => perfil.cursos.includes(c.id)).sort(ordCurso), [base.cursos, perfil.cursos])
  // Todos os planos de curso desses cursos, de qualquer autor (coordenador, auxiliar, diretor de núcleo)
  const cob = useMemo(() => {
    const ids = new Set(cursos.map((c) => c.id))
    return calcularCobertura(cursos, base.planos.filter((p) => p.tipo !== 'setor' && ids.has(p.curso_id)))
  }, [cursos, base.planos])
  const primeiroPendente = cob.linhas.find((l) => l.faltam.length)?.curso.id
  const [sel, setSel] = useState(cursos.some((c) => c.id === param) ? param : primeiroPendente || cursos[0]?.id || '')

  if (!cursos.length) return <Vazio>Você ainda não tem cursos vinculados. Fale com a CPA para vincular os seus cursos.</Vazio>

  const totalItens = cob.linhas.length * CATEGORIAS_PLANO.length
  const faltam = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
  const feitos = totalItens - faltam
  const linha = cob.linhas.find((l) => l.curso.id === sel)

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Resultados · montar planos</div>
          <h1>Monte aqui os planos de melhoria dos seus cursos.</h1>
          <p className="muted">
            Um plano para cada curso, cada modalidade e cada questionário. Escolha o curso, veja a nota e os comentários de cada questionário e
            <b> monte o plano</b>. Se, depois de analisar, não houver pontos a melhorar, use <b>“Não há pontos a melhorar”</b> e envie a sua justificativa.
            Satisfação Geral e Docência e Tutoria não entram aqui: Satisfação Geral não tem plano, e o plano dos docentes é conduzido pelo RH.
          </p>
        </div>
      </section>

      <div className={'card mp-progresso' + (faltam ? '' : ' completo')}>
        <div>
          <b style={{ fontSize: 20 }}>{faltam ? `Faltam ${faltam} de ${totalItens} questionários` : 'Tudo entregue! 🎉'}</b>
          <p className="small muted" style={{ margin: 0 }}>
            {faltam
              ? `${feitos} entregues. Os cursos com pendência estão marcados em vermelho na lista.`
              : 'Todos os questionários dos seus cursos têm plano enviado ou declaração de que não há pontos a melhorar.'}
          </p>
        </div>
        <div className="mp-barra" role="progressbar" aria-valuemin={0} aria-valuemax={totalItens} aria-valuenow={feitos} aria-label="Questionários entregues">
          <span style={{ width: `${totalItens ? (feitos / totalItens) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="ac-grade">
        <aside className="card ac-lista" aria-label="Seus cursos">
          <b>Seus cursos</b>
          <div className="ac-itens">
            {cob.linhas.map((l) => (
              <button key={l.curso.id} type="button" className={'ac-item' + (sel === l.curso.id ? ' sel' : '')} onClick={() => setSel(l.curso.id)}>
                <span className="ac-nome">{nomeCurso(l.curso)}<span className="small muted" style={{ display: 'block', fontWeight: 400 }}>{modalidade(l.curso)}</span></span>
                <span className={'ac-pend' + (l.faltam.length ? '' : ' zero')}>{l.faltam.length ? `${l.faltam.length} pend.` : '✓ ok'}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="ac-painel">
          {!linha ? (
            <Vazio>Escolha um curso na lista.</Vazio>
          ) : (
            <>
              <div className="mp-curso-h">
                <span className="eyebrow">{modalidade(linha.curso)}</span>
                <h2 style={{ fontSize: 26 }}>{nomeCurso(linha.curso)}</h2>
                <span className="small muted">{linha.faltam.length ? `Faltam ${linha.faltam.length} de ${CATEGORIAS_PLANO.length} questionários neste curso.` : 'Todos os questionários deste curso estão entregues.'}</span>
              </div>
              {CATEGORIAS_PLANO.map((d) => (
                <CartaoQuestionario key={linha.curso.id + d} d={d} l={linha} base={base} perfil={perfil} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function CartaoQuestionario({ d, l, base, perfil }) {
  const e = l.estado[d]
  const s = SITUACAO[e]
  const nota = base.notas[l.curso.id]?.[d]
  const planos = l.planosDim[d]
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''
  const devolvidos = planos.filter((p) => situacaoEnvio(p) === 'devolvido')
  const parados = planos.filter((p) => situacaoEnvio(p) === 'nao_enviado')
  const souCoord = perfil.role !== 'professor_auxiliar'

  return (
    <section className={'card mp-q ' + e}>
      <div className="mp-q-h">
        <span className={'ac-cel ' + s.c}>{s.i} {s.t}</span>
        <h3>{d}</h3>
        <div className="spacer" />
        {nota != null && <span className="small muted mp-nota">nota do curso <SeloNota v={nota} /> <b>{fmtNota(nota)}</b></span>}
      </div>

      {planos.length > 0 && (
        <ul className="mp-planos">
          {planos.map((p) => (
            <li key={p.id}>
              {p.sem_melhoria ? <span className="selo verde">Sem pontos a melhorar</span> : null}
              <b>{p.sem_melhoria ? '' : `“${p.titulo}”`}</b>
              <span className="small muted">{nomeDe(p.usuario_id)} · {rotuloStatus(p)}</span>
            </li>
          ))}
        </ul>
      )}

      {e === 'devolvido' && (
        <div className="mp-dica laranja">
          <b>A CPA devolveu este plano com um comentário.</b>
          {devolvidos.map((p) => p.comentario_revisor && <p key={p.id} className="small" style={{ margin: '4px 0 0' }}>“{p.comentario_revisor}”</p>)}
          <a className="btn sm" href="#/planos/meus" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Ajustar e reenviar em Meus planos</a>
        </div>
      )}
      {e === 'nao_enviado' && (
        <div className="mp-dica roxo">
          {souCoord && parados.some((p) => p.usuario_id !== perfil.id) ? (
            <>
              <b>Há plano do professor auxiliar esperando a sua revisão.</b> Ele só chega para a CPA depois que você revisar e enviar.
              <a className="btn sm" href="#/planos/equipe" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Revisar e enviar em Planos da equipe</a>
            </>
          ) : souCoord && parados.some((p) => p.usuario_id === perfil.id) ? (
            <>
              <b>Você escreveu este plano, mas ele ainda não foi enviado.</b> Plano sem envio não chega para a CPA.
              <a className="btn sm" href="#/planos/meus" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Abrir em Meus planos e enviar</a>
            </>
          ) : (
            <><b>Plano escrito, esperando o coordenador do curso revisar e enviar.</b></>
          )}
        </div>
      )}

      <div className="mp-acoes">
        <a className={'btn ' + (e === 'falta' ? 'escuro' : 'sm')} href={`#/q/${COD[d]}/${l.curso.id}`}>
          {e === 'falta' ? 'Abrir o questionário e analisar →' : 'Abrir o questionário →'}
        </a>
        {e === 'falta' && <span className="small muted">Lá você vê a nota, os pontos fortes e a melhorar e os comentários, e escolhe: montar o plano ou “Não há pontos a melhorar”.</span>}
      </div>
    </section>
  )
}

