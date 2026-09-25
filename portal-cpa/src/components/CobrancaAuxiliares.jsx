import { useEffect, useMemo, useState } from 'react'
import { montarCobrancaAuxiliares, coordenadoresPorCurso, podeVerPrazos } from '../lib/agenda.js'
import { rotuloCurso } from '../lib/escopo.js'
import { Vazio, Erro } from './ui.jsx'
import '../views/agenda.css'

// Cobrança dos professores auxiliares / coordenadores adjuntos: rascunhos parados com eles e
// planos deles esperando a revisão do coordenador do curso. Como no sistema anterior, fica na tela
// de Prazos, que é só do admin.
export default function CobrancaAuxiliares({ perfil, base }) {
  const [coords, setCoords] = useState(null)
  const [erro, setErro] = useState(null)
  const pode = podeVerPrazos(perfil)

  useEffect(() => {
    if (!pode) return
    let vivo = true
    coordenadoresPorCurso(base)
      .then((c) => vivo && setCoords(c))
      .catch((e) => {
        if (!vivo) return
        setErro(e)
        setCoords({})
      })
    return () => {
      vivo = false
    }
  }, [base, pode])

  const dados = useMemo(() => montarCobrancaAuxiliares(base, coords || {}), [base, coords])
  const porCurso = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])

  if (!pode) return null
  const semAux = 'Nenhum professor auxiliar / coordenador adjunto cadastrado ainda.'

  return (
    <>
      <Erro erro={erro} />
      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Rascunhos parados com o professor auxiliar</h2>
            <p className="muted small">O professor(a) auxiliar / coordenador adjunto ainda não enviou o plano — ele continua em rascunho, só com ele. Ordenado do que está parado há mais tempo pro que está parado há menos.</p>
          </div>
          <div className="spacer" />
          {dados.rascunhos.length > 0 && <span className="selo cinza">{dados.rascunhos.length}</span>}
        </div>
        {!dados.temAuxiliares ? <Vazio>{semAux}</Vazio> : dados.rascunhos.length === 0 ? (
          <Vazio>Nenhum rascunho parado com professor auxiliar no momento.</Vazio>
        ) : (
          <div className="ag-lista">{dados.rascunhos.map((x) => <CardCobranca key={x.p.id} x={x} curso={porCurso[x.p.curso_id]} />)}</div>
        )}
      </section>
      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Planos esperando o coordenador revisar</h2>
            <p className="muted small">Itens já enviados pelo professor(a) auxiliar / coordenador adjunto, parados na etapa de revisão do coordenador do curso. Ordenado do que espera há mais tempo pro que espera há menos.</p>
          </div>
          <div className="spacer" />
          {dados.aguardando.length > 0 && <span className="selo cinza">{dados.aguardando.length}</span>}
        </div>
        {!dados.temAuxiliares ? <Vazio>{semAux}</Vazio> : dados.aguardando.length === 0 ? (
          <Vazio>Nenhum plano de auxiliar esperando revisão do coordenador no momento.</Vazio>
        ) : (
          <div className="ag-lista">{dados.aguardando.map((x) => <CardCobranca key={x.p.id} x={x} curso={porCurso[x.p.curso_id]} />)}</div>
        )}
      </section>
    </>
  )
}

function CardCobranca({ x, curso }) {
  const cls = x.dias === null ? 'cinza' : x.dias >= 7 ? 'laranja' : 'verde'
  const diasTexto = x.dias === null ? 'data não registrada' : x.dias === 0 ? 'hoje' : `${x.dias} dia(s)`
  const alvo = curso ? rotuloCurso(curso) : x.p.curso_id || ''
  return (
    <div className="plano-item">
      <div className="ag-cab">
        <b>{x.p.titulo || alvo}</b>
        <span className={'selo ' + cls}>{x.rotuloTempo}: {diasTexto}</span>
      </div>
      <div className="chips" style={{ gap: 6 }}>
        {alvo && <span className="selo cinza">{alvo}</span>}
        {x.p.categoria && <span className="selo cinza">{x.p.categoria}</span>}
        <span className="selo escuro">Criado por: {x.autorNome}</span>
        {x.coordNome && <span className="selo cinza">Coordenador(a) responsável: {x.coordNome}</span>}
      </div>
      {x.p.descricao && <p className="ag-desc">{x.p.descricao}</p>}
    </div>
  )
}
