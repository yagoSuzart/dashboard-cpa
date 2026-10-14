// Encaminhar aos setores: o admin (Yago) analisa cada plano que depende de outro setor antes de ele chegar
// ao setor. Pode trocar o setor, acrescentar setores, editar, excluir e deixar um recado. Nada chega ao setor
// sem ser liberado aqui. Setores sem ninguém com acesso ao Portal ficam sob a responsabilidade do admin (PDF).
import { useMemo, useState } from 'react'
import { areasDisponiveis, atualizarPlano, destinosDo, excluirPlano, fmtData, nomeArea, rotuloStatus, setorTemAcesso } from '../lib/planos.js'
import { rotuloCurso } from '../lib/escopo.js'
import { Vazio } from '../components/ui.jsx'
import './planos.css'
import './proxima.css'

const FILTROS = {
  analisar: { t: 'Para analisar', d: 'Ainda não chegaram aos setores' },
  liberados: { t: 'Liberados aos setores', d: 'Os setores já veem' },
  comigo: { t: 'Com você', d: 'Destinos sem ninguém com acesso ao Portal' },
}

export default function Triagem({ base, recarregarBase }) {
  const externos = useMemo(() => base.planos.filter((p) => p.externa && p.status !== 'rascunho'), [base.planos])
  const semAcesso = (a) => !setorTemAcesso(a, base.usuarios)
  const comigo = (p) => destinosDo(p).some(semAcesso)
  const grupos = {
    analisar: externos.filter((p) => p.triagem !== 'liberado'),
    liberados: externos.filter((p) => p.triagem === 'liberado'),
    comigo: externos.filter(comigo),
  }
  const [filtro, setFiltro] = useState('analisar')
  const [destino, setDestino] = useState('')
  const [aviso, setAviso] = useState(null)
  const areas = areasDisponiveis(base.setores)
  const lista = grupos[filtro].filter((p) => !destino || destinosDo(p).includes(destino))
  const curso = (id) => rotuloCurso(base.cursos.find((c) => c.id === id)) || id

  // Destinos sem acesso que têm planos: um PDF por destino para o admin mandar ao responsável
  const destinosComigo = [...new Set(grupos.comigo.flatMap((p) => destinosDo(p).filter(semAcesso)))]
  const baixarPdf = async (area) => {
    const pdf = await import('../lib/pdf.js')
    const msg = await pdf.baixarPdfDemandas({ base, area, planos: grupos.comigo.filter((p) => destinosDo(p).includes(area)) })
    setAviso({ tipo: 'ok', txt: msg })
  }
  const mudou = async (msg) => {
    setAviso(msg ? { tipo: 'ok', txt: msg } : null)
    await recarregarBase()
  }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Planos de ação · encaminhamento aos setores</div>
          <h1>Antes de chegar aos setores, passa por você.</h1>
          <p className="muted">Os planos em que o coordenador marcou “depende de outro setor” só aparecem para o setor depois que você liberar. Aqui você troca o setor, acrescenta outros, edita, exclui e deixa um recado. Destinos sem ninguém com acesso ao Portal ficam com você.</p>
        </div>
      </section>
      {aviso && <div className={'aviso ' + (aviso.tipo || '')} role="status" onClick={() => setAviso(null)}>{aviso.txt}</div>}

      <div className="px-blocos" role="group" aria-label="Situação">
        {Object.entries(FILTROS).map(([k, f]) => (
          <button key={k} type="button" className={'px-bloco' + (k === 'analisar' && grupos.analisar.length ? ' alerta' : k === 'liberados' ? ' ok' : '')} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            <span className="q">{grupos[k].length}</span>
            <span className="t">{f.t}</span>
            <span className="d">{f.d}</span>
          </button>
        ))}
      </div>

      {filtro === 'comigo' && destinosComigo.length > 0 && (
        <section className="card" style={{ gap: 10 }}>
          <h2 style={{ fontSize: 20 }}>Sob a sua responsabilidade</h2>
          <p className="small muted">Estes destinos ainda não têm ninguém com acesso ao Portal. Baixe o PDF de cada um e envie ao responsável até criar o acesso.</p>
          <div className="filtros" style={{ gap: 8 }}>
            {destinosComigo.map((a) => (
              <button key={a} className="btn sm" onClick={() => baixarPdf(a)}>PDF · {nomeArea(a, base.setores)} ({grupos.comigo.filter((p) => destinosDo(p).includes(a)).length})</button>
            ))}
          </div>
        </section>
      )}

      <div className="filtros">
        <label className="small" htmlFor="tr-dest" style={{ fontWeight: 700 }}>Setor</label>
        <select id="tr-dest" className="input" style={{ height: 38, fontSize: 14, maxWidth: 380 }} value={destino} onChange={(e) => setDestino(e.target.value)}>
          <option value="">Todos os setores</option>
          {areas.map((a) => <option key={a.v} value={a.v}>{a.t}{semAcesso(a.v) ? ' (sem acesso no Portal)' : ''}</option>)}
        </select>
        <span className="small muted">{lista.length} {lista.length === 1 ? 'plano' : 'planos'}</span>
      </div>

      {!lista.length && <Vazio>{filtro === 'analisar' ? 'Nenhum plano esperando a sua análise.' : 'Nenhum plano aqui.'}</Vazio>}
      {lista.map((p) => (
        <CartaoTriagem key={p.id} p={p} base={base} areas={areas} semAcesso={semAcesso} curso={curso} onMudou={mudou} />
      ))}
    </>
  )
}

function CartaoTriagem({ p, base, areas, semAcesso, curso, onMudou }) {
  const [area, setArea] = useState(p.area || areas[0]?.v)
  const [extras, setExtras] = useState(() => (p.areas_extra || []).filter((a) => a !== p.area))
  const [obs, setObs] = useState(p.triagem_obs || '')
  const [editando, setEditando] = useState(false)
  const [conteudo, setConteudo] = useState({ titulo: p.titulo, descricao: p.descricao, queixa_aluno: p.queixa_aluno || '' })
  const [excluir, setExcluir] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)
  const autor = base.usuarios.find((u) => u.id === p.usuario_id)
  const liberado = p.triagem === 'liberado'
  const destinos = [...new Set([area, ...extras])].filter(Boolean)
  const comigo = destinos.filter(semAcesso)
  const vaoAoSetor = destinos.filter((a) => !semAcesso(a))
  const alterou = area !== p.area || extras.join() !== (p.areas_extra || []).filter((a) => a !== p.area).join() || (obs || '') !== (p.triagem_obs || '')

  const rodar = async (fn, msg) => {
    setOcupado(true)
    setErro(null)
    try {
      await fn()
      await onMudou(msg)
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setOcupado(false)
    }
  }
  const encaminhamento = { area, areas_extra: extras.filter((a) => a !== area), triagem_obs: obs.trim() || null }
  const liberar = () => rodar(() => atualizarPlano(p.id, { ...encaminhamento, triagem: 'liberado', triagem_em: new Date().toISOString() }),
    vaoAoSetor.length ? `Liberado para ${vaoAoSetor.map((a) => nomeArea(a, base.setores)).join(', ')}.${comigo.length ? ' O restante fica com você.' : ''}` : 'Liberado. Este plano fica com você (destino sem acesso ao Portal).')
  const salvar = () => rodar(() => atualizarPlano(p.id, encaminhamento), 'Encaminhamento salvo (ainda não liberado).')
  const voltar = () => rodar(() => atualizarPlano(p.id, { triagem: null, triagem_em: null }), 'O plano voltou para a sua análise e saiu da tela dos setores.')
  const salvarConteudo = () => rodar(async () => {
    await atualizarPlano(p.id, { titulo: conteudo.titulo.trim(), descricao: conteudo.descricao.trim(), queixa_aluno: conteudo.queixa_aluno.trim() || null })
    setEditando(false)
  }, 'Plano editado.')
  const apagar = () => rodar(() => excluirPlano(p.id), 'Plano excluído.')
  const alternarExtra = (a) => setExtras((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))

  return (
    <article className={'card tr-card' + (liberado ? ' liberado' : '')} style={{ gap: 12 }}>
      <div className="tr-topo">
        <span className="small muted">{curso(p.curso_id)} · {autor?.nome || '—'} · {rotuloStatus(p)}{p.prazo ? ` · prazo ${fmtData(p.prazo)}` : ''}</span>
        {liberado ? <span className="selo verde">Liberado{p.triagem_por ? ` por ${p.triagem_por}` : ''}{p.triagem_em ? ` em ${fmtData(p.triagem_em)}` : ''}</span> : <span className="selo laranja">Ainda não chegou ao setor</span>}
      </div>

      {editando ? (
        <div className="coluna" style={{ gap: 8 }}>
          <label className="small" htmlFor={'tr-t-' + p.id} style={{ fontWeight: 700 }}>Título</label>
          <input id={'tr-t-' + p.id} className="input" value={conteudo.titulo} onChange={(e) => setConteudo({ ...conteudo, titulo: e.target.value })} />
          <label className="small" htmlFor={'tr-d-' + p.id} style={{ fontWeight: 700 }}>O que será feito</label>
          <textarea id={'tr-d-' + p.id} className="input" rows={4} style={{ height: 'auto', padding: 10 }} value={conteudo.descricao} onChange={(e) => setConteudo({ ...conteudo, descricao: e.target.value })} />
          <label className="small" htmlFor={'tr-q-' + p.id} style={{ fontWeight: 700 }}>O que os alunos apontaram</label>
          <textarea id={'tr-q-' + p.id} className="input" rows={3} style={{ height: 'auto', padding: 10 }} value={conteudo.queixa_aluno} onChange={(e) => setConteudo({ ...conteudo, queixa_aluno: e.target.value })} />
          <div className="filtros" style={{ gap: 8 }}>
            <button className="btn sm escuro" disabled={ocupado || !conteudo.titulo.trim() || !conteudo.descricao.trim()} onClick={salvarConteudo}>Salvar</button>
            <button className="btn sm" onClick={() => { setConteudo({ titulo: p.titulo, descricao: p.descricao, queixa_aluno: p.queixa_aluno || '' }); setEditando(false) }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: 19 }}>{p.titulo}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{p.descricao}</p>
          {p.queixa_aluno && <p className="small"><b>O que os alunos apontaram:</b> {p.queixa_aluno}</p>}
          {p.comentarios_selecionados?.length > 0 && (
            <details>
              <summary className="small" style={{ fontWeight: 700, cursor: 'pointer' }}>Comentários dos alunos anexados ({p.comentarios_selecionados.length})</summary>
              <ul className="small" style={{ paddingLeft: 18, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {p.comentarios_selecionados.map((c, i) => <li key={i} style={{ whiteSpace: 'pre-line' }}>{String(c).replace(/\\n/g, '\n')}</li>)}
              </ul>
            </details>
          )}
          {!p.queixa_aluno && !p.comentarios_selecionados?.length && <p className="small" style={{ color: 'var(--ember-ink)' }}>Sem comentários dos alunos anexados nem descrição do que os alunos apontaram.</p>}
        </>
      )}

      <div className="tr-encaminhar">
        <div className="campo" style={{ minWidth: 260 }}>
          <label className="small" htmlFor={'tr-a-' + p.id} style={{ fontWeight: 700 }}>Setor principal</label>
          <select id={'tr-a-' + p.id} className="input" value={area} onChange={(e) => { setArea(e.target.value); setExtras((x) => x.filter((y) => y !== e.target.value)) }}>
            {areas.map((a) => <option key={a.v} value={a.v}>{a.t}{semAcesso(a.v) ? ' (com você)' : ''}</option>)}
          </select>
          {p.area && area !== p.area && <span className="small muted">O coordenador mandou para: {nomeArea(p.area, base.setores)}</span>}
        </div>
        <fieldset className="tr-extras">
          <legend className="small" style={{ fontWeight: 700 }}>Também encaminhar para</legend>
          {areas.filter((a) => a.v !== area).map((a) => (
            <label key={a.v} className="small">
              <input type="checkbox" checked={extras.includes(a.v)} onChange={() => alternarExtra(a.v)} /> {a.t.replace(/ \(.*\)$/, '')}{semAcesso(a.v) ? ' (com você)' : ''}
            </label>
          ))}
        </fieldset>
        <div className="campo" style={{ flex: 1, minWidth: 240 }}>
          <label className="small" htmlFor={'tr-o-' + p.id} style={{ fontWeight: 700 }}>Recado para o setor (opcional)</label>
          <textarea id={'tr-o-' + p.id} className="input" rows={3} style={{ height: 'auto', padding: 10 }} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: priorizar o laboratório 3; alinhar prazo com a coordenação" />
        </div>
      </div>

      <p className="small">
        {vaoAoSetor.length > 0 && <>Vai para: <b>{vaoAoSetor.map((a) => nomeArea(a, base.setores)).join(', ')}</b>. </>}
        {comigo.length > 0 && <>Fica com você: <b>{comigo.map((a) => nomeArea(a, base.setores)).join(', ')}</b> (sem ninguém com acesso ao Portal).</>}
      </p>
      {erro && <div className="aviso erro">{erro}</div>}
      <div className="filtros" style={{ gap: 8 }}>
        {!liberado ? (
          <button className="btn escuro" disabled={ocupado} onClick={liberar}>{vaoAoSetor.length ? 'Aprovar e liberar para os setores' : 'Aprovar (fica com você)'}</button>
        ) : (
          <>
            {alterou && <button className="btn escuro" disabled={ocupado} onClick={liberar}>Salvar o novo encaminhamento</button>}
            <button className="btn" disabled={ocupado} onClick={voltar}>Tirar dos setores e voltar para análise</button>
          </>
        )}
        {!liberado && alterou && <button className="btn" disabled={ocupado} onClick={salvar}>Salvar sem liberar</button>}
        {!editando && <button className="btn" onClick={() => setEditando(true)}>Editar o plano</button>}
        {!excluir ? (
          <button className="btn" style={{ color: 'var(--ember-deep)' }} onClick={() => setExcluir(true)}>Excluir</button>
        ) : (
          <span className="filtros" style={{ gap: 6 }}>
            <span className="small">Excluir este plano de vez?</span>
            <button className="btn sm escuro" disabled={ocupado} onClick={apagar}>Sim, excluir</button>
            <button className="btn sm" onClick={() => setExcluir(false)}>Não</button>
          </span>
        )}
      </div>
    </article>
  )
}
