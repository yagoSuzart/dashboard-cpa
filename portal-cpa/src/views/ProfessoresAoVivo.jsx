// Professores · CPA ao vivo (depois do login): média de cada professor no questionário Docente e quantos alunos
// avaliaram, por curso. O banco só entrega os cursos da própria pessoa (coordenação, adjunto, diretor de núcleo);
// a supervisão global vê todos. Sem comentários: só os números do último CSV que a CPA publicou.
import { useEffect, useMemo, useState } from 'react'
import { carregarProfessores, fmtNum } from '../lib/aoVivo.js'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { Carregando, Vazio } from '../components/ui.jsx'
import './aoVivo.css'

const MINIMOS = [1, 5, 10, 30]
const cor = (v) => (v >= 4.3 ? '#1c6db3' : v >= 4 ? '#7fb4e6' : v >= 3.5 ? '#f3b88a' : '#c2410c')
const nota = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ProfessoresAoVivo({ base }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [curso, setCurso] = useState('')
  const [busca, setBusca] = useState('')
  const [minimo, setMinimo] = useState(10)
  const [ordem, setOrdem] = useState('nota')

  useEffect(() => {
    let vivo = true
    carregarProfessores().then((x) => vivo && setLista(x)).catch((e) => vivo && setErro(e))
    return () => { vivo = false }
  }, [])

  const nomeCurso = (id) => {
    const c = base.cursos.find((x) => x.id === id)
    return c ? `${c.nome} · ${MODALIDADE_LABEL[c.modalidade] || c.modalidade}` : id
  }
  const cursos = useMemo(() => [...new Set((lista || []).map((p) => p.curso_id))].sort((a, b) => nomeCurso(a).localeCompare(nomeCurso(b), 'pt-BR')), [lista]) // eslint-disable-line react-hooks/exhaustive-deps
  const termo = busca.trim().toLowerCase()
  const doCurso = (lista || []).filter((p) => (!curso || p.curso_id === curso) && (!termo || p.docente.toLowerCase().includes(termo) || p.disciplinas.some((d) => d.toLowerCase().includes(termo))))
  const visiveis = doCurso.filter((p) => p.alunos >= minimo).sort((a, b) => (ordem === 'nota' ? b.media - a.media || b.alunos - a.alunos : b.alunos - a.alunos || b.media - a.media))
  const ocultos = doCurso.length - visiveis.length

  if (erro) return <div className="aviso erro" role="alert">Não foi possível carregar o ranking de professores: {erro.message}</div>
  if (!lista) return <Carregando texto="Carregando o ranking de professores…" />

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Parcial da CPA · professores</div>
          <h1>Como os alunos estão avaliando os professores.</h1>
          <p className="muted">Média de 1 a 5 no questionário Docente e quantos alunos avaliaram cada professor, nos cursos que você acompanha. {lista[0] && `Atualizado em ${new Date(lista[0].publicado_em).toLocaleString('pt-BR')}.`}</p>
        </div>
      </section>

      <div className="pr-cuidado" role="note">
        <b>Uso responsável e confidencial.</b> O resultado é parcial: a avaliação ainda está aberta, e professores avaliados por poucos alunos podem mudar muito. Use para conversar e apoiar o desenvolvimento do professor, nunca como decisão isolada. Estes números são sigilosos e não devem ser compartilhados fora da coordenação.
      </div>

      {!lista.length ? (
        <Vazio>A CPA ainda não publicou o ranking de professores deste ciclo, ou os seus cursos ainda não têm avaliações no questionário Docente.</Vazio>
      ) : (
        <section className="card" style={{ gap: 14 }}>
          <div className="pr-filtros">
            {cursos.length > 1 && (
              <label className="campo"><span className="small muted">Curso</span>
                <select className="input" value={curso} onChange={(e) => setCurso(e.target.value)}>
                  <option value="">Todos os meus cursos</option>
                  {cursos.map((id) => <option key={id} value={id}>{nomeCurso(id)}</option>)}
                </select>
              </label>
            )}
            <label className="campo"><span className="small muted">Professor ou disciplina</span>
              <input className="input" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar" />
            </label>
            <label className="campo" style={{ maxWidth: 200 }}><span className="small muted">Mínimo de alunos que avaliaram</span>
              <select className="input" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))}>
                {MINIMOS.map((m) => <option key={m} value={m}>{m === 1 ? 'Todos' : `${m} ou mais`}</option>)}
              </select>
            </label>
            <div className="seg" role="group" aria-label="Ordenar">
              <button aria-pressed={ordem === 'nota'} onClick={() => setOrdem('nota')}>Maior nota</button>
              <button aria-pressed={ordem === 'alunos'} onClick={() => setOrdem('alunos')}>Mais avaliado</button>
            </div>
          </div>

          {!visiveis.length ? (
            <Vazio>Nenhum professor com {minimo} ou mais alunos neste filtro.</Vazio>
          ) : (
            <div className="rolagem">
              <table className="tabela">
                <thead><tr><th>#</th><th>Professor</th>{!curso && cursos.length > 1 && <th>Curso</th>}<th>Disciplinas</th><th className="n">Alunos</th><th className="n">Média (1 a 5)</th></tr></thead>
                <tbody>
                  {visiveis.map((p, i) => (
                    <tr key={p.curso_id + p.docente}>
                      <td>{i + 1}</td>
                      <td><b>{p.docente}</b></td>
                      {!curso && cursos.length > 1 && <td className="small">{nomeCurso(p.curso_id)}</td>}
                      <td className="small">{p.disciplinas.slice(0, 2).join(', ')}{p.disciplinas.length > 2 ? ` +${p.disciplinas.length - 2}` : ''}</td>
                      <td className="n">{fmtNum(p.alunos)}</td>
                      <td className="n">
                        <span className="pr-nota"><b>{nota(p.media)}</b><span className="barra" aria-hidden="true"><i style={{ width: (p.media / 5) * 100 + '%', background: cor(p.media) }} /></span></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ocultos > 0 && <p className="pr-poucos">{ocultos} professor(es) com menos de {minimo} alunos não aparecem neste filtro.</p>}
        </section>
      )}
    </>
  )
}
