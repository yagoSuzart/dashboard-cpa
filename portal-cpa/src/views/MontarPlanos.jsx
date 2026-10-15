// Montar planos: o lugar do coordenador para fazer os planos de melhoria. Um curso (curso + modalidade) por vez;
// para cada questionário (as 5 dimensões; Satisfação Geral não tem plano) mostra a nota, o que já foi feito e o que
// falta, com dois caminhos: montar o plano ou declarar que não há pontos a melhorar.
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtNota } from '../lib/cpa.js'
import { CATEGORIAS_PLANO, TEXTO_SEM_MELHORIA, criarDeclaracaoSemMelhoria, rotuloStatus, statusDeEnvio } from '../lib/planos.js'
import { calcularCobertura, nomeCurso, ordCurso, situacaoEnvio } from '../lib/cobertura.js'
import FormPlano from '../components/FormPlano.jsx'
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

export default function MontarPlanos({ perfil, base, param, recarregarBase, aoEnviarPlano }) {
  const cursos = useMemo(() => base.cursos.filter((c) => perfil.cursos.includes(c.id)).sort(ordCurso), [base.cursos, perfil.cursos])
  // Todos os planos de curso desses cursos, de qualquer autor (coordenador, auxiliar, diretor de núcleo)
  const cob = useMemo(() => {
    const ids = new Set(cursos.map((c) => c.id))
    return calcularCobertura(cursos, base.planos.filter((p) => p.tipo !== 'setor' && ids.has(p.curso_id)))
  }, [cursos, base.planos])
  const primeiroPendente = cob.linhas.find((l) => l.faltam.length)?.curso.id
  const [sel, setSel] = useState(cursos.some((c) => c.id === param) ? param : primeiroPendente || cursos[0]?.id || '')
  const [aviso, setAviso] = useState(null)

  if (!cursos.length) return <Vazio>Você ainda não tem cursos vinculados. Fale com a CPA para vincular os seus cursos.</Vazio>

  const totalItens = cob.linhas.length * CATEGORIAS_PLANO.length
  const faltam = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
  const feitos = totalItens - faltam
  const linha = cob.linhas.find((l) => l.curso.id === sel)
  const mudou = (msg) => {
    setAviso(msg)
    aoEnviarPlano?.()
    recarregarBase()
  }

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
      {aviso && <div className="aviso ok" role="status" onClick={() => setAviso(null)}>{aviso}</div>}

      <div className="ac-grade">
        <aside className="card ac-lista" aria-label="Seus cursos">
          <b>Seus cursos</b>
          <div className="ac-itens">
            {cob.linhas.map((l) => (
              <button key={l.curso.id} type="button" className={'ac-item' + (sel === l.curso.id ? ' sel' : '')} onClick={() => { setSel(l.curso.id); setAviso(null) }}>
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
                <CartaoQuestionario key={linha.curso.id + d} d={d} l={linha} base={base} perfil={perfil} onMudou={mudou} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function CartaoQuestionario({ d, l, base, perfil, onMudou }) {
  const [modo, setModo] = useState('') // '' | 'plano' | 'sem'
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

      {!modo && (
        <div className="mp-acoes">
          {e === 'falta' ? (
            <>
              <button className="btn escuro" onClick={() => setModo('plano')}>Montar plano</button>
              <button className="btn" onClick={() => setModo('sem')}>Não há pontos a melhorar</button>
            </>
          ) : e === 'ok' ? (
            <button className="btn sm" onClick={() => setModo('plano')}>Montar outro plano</button>
          ) : null}
          <a className="small" href={`#/q/${COD[d]}/${l.curso.id}`}>Ver nota e comentários deste questionário →</a>
        </div>
      )}

      {modo === 'plano' && (
        <>
          <FormPlano perfil={perfil} base={base} escopo={[l.curso]} cursoInicial={l.curso.id} categoriaInicial={d}
            titulo={`Plano de ação · ${d} · ${nomeCurso(l.curso)} (${modalidade(l.curso)})`}
            onEnviado={() => { setModo(''); onMudou(`Plano de ${d} enviado.`) }} />
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setModo('')}>Cancelar</button>
        </>
      )}
      {modo === 'sem' && <SemMelhoria d={d} curso={l.curso} perfil={perfil} onCancelar={() => setModo('')} onEnviado={(m) => { setModo(''); onMudou(m) }} />}
    </section>
  )
}

function SemMelhoria({ d, curso, perfil, onCancelar, onEnviado }) {
  const [texto, setTexto] = useState(TEXTO_SEM_MELHORIA)
  const [confirmo, setConfirmo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const vaiPara = statusDeEnvio(perfil) === 'aguardando_coordenador' ? 'o coordenador do curso' : 'a análise da CPA'

  async function enviar() {
    if (texto.trim().length < 40) return setErro('Escreva ao menos algumas linhas explicando por que não há pontos a melhorar.')
    if (!confirmo) return setErro('Marque a confirmação de que analisou as notas e os comentários.')
    setEnviando(true)
    setErro('')
    try {
      await criarDeclaracaoSemMelhoria(perfil, { curso_id: curso.id, categoria: d, texto: texto.trim() })
      onEnviado(`Declaração “sem pontos a melhorar” de ${d} enviada para ${vaiPara}.`)
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar.')
      setEnviando(false)
    }
  }

  return (
    <div className="mp-sem">
      <b>Não há pontos a melhorar em {d}</b>
      <p className="small muted" style={{ margin: 0 }}>
        Use somente se, depois de analisar a nota e os comentários dos alunos deste questionário em {nomeCurso(curso)} ({modalidade(curso)}), não houver
        ponto que precise de ação. Ajuste o texto abaixo com as palavras do seu curso. Ao enviar, segue para {vaiPara} e conta como entregue.
      </p>
      <label className="sr-only" htmlFor={'sm-' + d}>Justificativa</label>
      <textarea id={'sm-' + d} rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} />
        Confirmo que analisei a nota e os comentários deste questionário e não identifiquei pontos que exijam um plano de melhoria.
      </label>
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <div className="mp-acoes">
        <button className="btn escuro" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar declaração'}</button>
        <button className="btn" onClick={onCancelar} disabled={enviando}>Cancelar</button>
      </div>
    </div>
  )
}
