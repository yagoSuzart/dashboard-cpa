// Fim da página do questionário (depois da nota, dos pontos fortes / a melhorar e dos comentários): a situação deste
// questionário no curso e os dois caminhos do coordenador — montar o plano de melhoria ou declarar que não há pontos
// a melhorar (com a devolutiva para os alunos).
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { rotuloStatus } from '../lib/planos.js'
import { calcularCobertura } from '../lib/cobertura.js'
import FormPlano from './FormPlano.jsx'
import SemMelhoria from './SemMelhoria.jsx'

const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const SITUACAO = {
  ok: ['ok', '✓ Entregue'],
  nao_enviado: ['nao_enviado', '✎ Escrito, falta enviar'],
  devolvido: ['devolvido', '↩ Devolvido: ajustar e reenviar'],
  falta: ['falta', '! Falta montar'],
}

export default function PlanoNoQuestionario({ perfil, base, curso, categoria, comentarios, onEnviado }) {
  const [modo, setModo] = useState('')
  const [aviso, setAviso] = useState('')
  const feito = (m) => { setModo(''); setAviso(m); onEnviado() }
  const linha = useMemo(
    () => calcularCobertura([curso], base.planos.filter((p) => p.tipo !== 'setor' && p.curso_id === curso.id)).linhas[0],
    [curso, base.planos],
  )
  const e = linha.estado[categoria]
  const planos = linha.planosDim[categoria]
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''
  const nota = base.notas[curso.id]?.[categoria]
  const [cls, txt] = SITUACAO[e]

  return (
    <div className="pq">
      <div className="pq-h">
        <span className={'ac-cel ' + cls}>{txt}</span>
        <b>Plano de melhoria · {categoria} · {curso.nome} ({modalidade(curso)})</b>
        <div className="spacer" />
        <a className="small" href={'#/montar/' + curso.id}>← Voltar para Montar planos</a>
      </div>
      {aviso && <div className="aviso ok" role="status">{aviso} <a href={'#/montar/' + curso.id}>Ver o que ainda falta →</a></div>}
      {planos.length > 0 && (
        <ul className="mp-planos">
          {planos.map((p) => (
            <li key={p.id}>
              {p.sem_melhoria ? <span className="selo verde">Sem pontos a melhorar</span> : <b>“{p.titulo}”</b>}
              <span className="small muted">{nomeDe(p.usuario_id)} · {rotuloStatus(p)}</span>
            </li>
          ))}
        </ul>
      )}
      {e === 'devolvido' && <a className="btn sm" href="#/planos/meus" style={{ alignSelf: 'flex-start' }}>Ajustar e reenviar em Meus planos</a>}

      {!modo && (
        <>
          <p className="small muted" style={{ margin: 0 }}>
            {e === 'ok'
              ? 'Este questionário já está entregue neste curso. Se quiser, você pode montar outro plano.'
              : 'Depois de analisar a nota, os pontos fortes, os pontos a melhorar e os comentários acima, escolha um caminho:'}
          </p>
          <div className="pq-escolha">
            <button className="pq-opcao plano" onClick={() => setModo('plano')}>
              <b>{e === 'ok' ? 'Montar outro plano' : 'Montar plano de melhoria'}</b>
              <span>Há pontos a melhorar: descrevo o que será feito, o prazo e como vou medir.</span>
            </button>
            {e !== 'ok' && (
              <button className="pq-opcao sem" onClick={() => setModo('sem')}>
                <b>Não há pontos a melhorar</b>
                <span>O curso está bem neste questionário: envio uma devolutiva positiva para os alunos.</span>
              </button>
            )}
          </div>
        </>
      )}
      {modo === 'plano' && (
        <>
          <FormPlano key={curso.id + categoria} perfil={perfil} base={base} escopo={[curso]} cursoInicial={curso.id} categoriaInicial={categoria}
            titulo={`Plano de ação · ${categoria}`} comentarios={comentarios} mostrarSelecao={false}
            onEnviado={() => feito(`Plano de ${categoria} enviado.`)} />
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setModo('')}>Voltar às opções</button>
        </>
      )}
      {modo === 'sem' && (
        <SemMelhoria d={categoria} curso={curso} perfil={perfil} nota={nota} onCancelar={() => setModo('')} onEnviado={feito} />
      )}
    </div>
  )
}
