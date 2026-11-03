// Retorno da CPA aos alunos — página pública (sem login), aberta pelo QR code / link do card-resumo do feedback.
// Um curso + modalidade por página (opcionalmente com a turma no título). Os dados vêm da função do banco
// cpa_retorno_publico, que só devolve planos aprovados/concluídos e só campos públicos.
import { useEffect, useState } from 'react'
import { sb } from '../lib/dados.js'
import { MODALIDADE_LABEL } from '../lib/config.js'
import './retorno.css'

const mesAno = (s) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '')

export default function RetornoPublico({ param }) {
  const [cursoId, turma = ''] = String(param || '').split('/')
  const [estado, setEstado] = useState({ carregando: true })

  useEffect(() => {
    let vivo = true
    if (!cursoId) return
    sb.rpc('cpa_retorno_publico', { p_curso: cursoId }).then(({ data, error }) => {
      if (!vivo) return
      if (error) setEstado({ erro: true })
      else setEstado({ linhas: data || [] })
    })
    return () => {
      vivo = false
    }
  }, [cursoId])

  const linhas = estado.linhas || []
  const curso = linhas[0]
  const itens = linhas.filter((l) => l.titulo)
  const acoes = itens.filter((l) => !l.sem_melhoria)
  const fortes = itens.filter((l) => l.sem_melhoria)
  const modalidade = curso ? MODALIDADE_LABEL[curso.modalidade] || curso.modalidade : ''

  return (
    <div className="rt">
      <header className="rt-topo">
        <img src="/logo-unifecaf-branco.png" alt="UniFECAF" className="rt-logo" />
        <span className="rt-pilula">Resultado da CPA</span>
      </header>

      {!cursoId || estado.erro ? (
        <section className="rt-hero"><h1>Página não encontrada.</h1><p>Confira o link recebido da coordenação do seu curso.</p></section>
      ) : estado.carregando || !estado.linhas ? (
        <section className="rt-hero"><p>Carregando…</p></section>
      ) : !curso ? (
        <section className="rt-hero"><h1>Curso não encontrado.</h1><p>Confira o link recebido da coordenação do seu curso.</p></section>
      ) : (
        <>
          <section className="rt-hero">
            <span className="rt-eyebrow">Você falou · a gente ouviu</span>
            <h1>O que a sua resposta virou em {curso.curso_nome}.</h1>
            <div className="rt-chips">
              <span>{modalidade}</span>
              {turma && <span>Turma {turma}</span>}
            </div>
            <p>
              {acoes.length
                ? `${acoes.length} ${acoes.length === 1 ? 'ação está' : 'ações estão'} em andamento a partir das respostas de vocês na avaliação da CPA.`
                : 'As respostas de vocês na avaliação da CPA foram analisadas pela coordenação.'}
            </p>
          </section>

          <main className="rt-corpo">
            {!itens.length && <div className="rt-vazio">As ações deste curso ainda estão em análise pela CPA. Volte em breve: esta página é atualizada automaticamente.</div>}

            {acoes.map((a, i) => (
              <article key={i} className="rt-acao">
                <span className="rt-q">{a.questionario}</span>
                <h2>{a.titulo}</h2>
                <div className="rt-fazer">
                  <span className="rt-eyebrow">O que vamos fazer</span>
                  <p>{a.descricao}</p>
                </div>
                <div className="rt-meta">
                  {a.prazo && <span><small>Prazo</small><b>{mesAno(a.prazo)}</b></span>}
                  <span><small>Situação</small><b className="ok">{a.status === 'concluido' ? '✓ Concluído' : '✓ Em andamento'}</b></span>
                </div>
              </article>
            ))}

            {fortes.map((f, i) => (
              <article key={'f' + i} className="rt-forte">
                <span className="rt-q">Ponto forte · {f.questionario}</span>
                <h2>Aqui, vocês aprovaram o curso.</h2>
                <p>{f.descricao}</p>
              </article>
            ))}

            <section className="rt-caminho">
              <h2>Como cada plano vira realidade</h2>
              <ol>
                <li><b>Coordenação</b><span>escreve o plano a partir das respostas</span></li>
                <li><b>CPA</b><span>analisa se o plano responde ao que vocês apontaram</span></li>
                <li><b>Pró-Reitoria</b><span>aprova e acompanha até a conclusão</span></li>
              </ol>
              <p className="rt-frase">Seu sonho, nossa meta!</p>
            </section>
          </main>
        </>
      )}
      <footer className="rt-rodape">CPA UniFECAF · Comissão Própria de Avaliação</footer>
    </div>
  )
}
