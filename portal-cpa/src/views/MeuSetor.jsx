import { useEffect, useMemo, useState } from 'react'
import { fmtNota, fmtInt, textoComentario, SENTIMENTO } from '../lib/cpa.js'
import { buscarComentarios } from '../lib/dados.js'
import { rotuloCurso } from '../lib/escopo.js'
import { PRIORIDADES, fmtData } from '../lib/planos.js'
import { COLUNAS_FLUXO, PALAVRAS_SETOR, criarPlanoDaDemanda, demandasParaSetor, rankClasseSetor } from '../lib/nucleo.js'
import { Anel, BarraNota, Carregando, Erro, Paginacao, Vazio } from '../components/ui.jsx'
import FormPlano from '../components/FormPlano.jsx'
import ItemPlano, { Modal } from '../components/ItemPlano.jsx'
import { BotaoPdf } from '../components/BotoesPdf.jsx'
import './nucleo.css'

const INFRA = 'Infraestrutura e Atendimento'
const ABAS = [
  ['geral', 'Visão geral'],
  ['demandas', 'Demandas recebidas'],
  ['plano', 'Plano de melhoria'],
]

// Responsável de setor (role 'setor'): visão geral, demandas recebidas e plano de melhoria do setor
export default function MeuSetor({ perfil, base, param, recarregarBase }) {
  const [aba, setAba] = useState(ABAS.some(([k]) => k === param) ? param : 'geral')
  const [selecionados, setSelecionados] = useState([])
  const [msg, setMsg] = useState(null)
  const setor = base.setores.find((s) => s.id === perfil.setor)

  const meusPlanos = useMemo(
    () => base.planos.filter((p) => p.usuario_id === perfil.id || (p.tipo === 'setor' && p.setor_id === perfil.setor)),
    [base.planos, perfil.id, perfil.setor],
  )
  const demandas = useMemo(() => demandasParaSetor(base.planos, base.usuarios, perfil.setor), [base.planos, base.usuarios, perfil.setor])
  const abertas = demandas.filter((d) => !d.atendido_pelo_setor).length

  if (!setor) return <Vazio>Seu usuário ainda não está vinculado a um setor. Peça a correção para a Coordenação da CPA.</Vazio>

  const mudou = (t) => {
    setMsg(t ? { t, c: 'ok' } : null)
    return recarregarBase()
  }
  const alternar = (t) => setSelecionados((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Infraestrutura e atendimento · Meu setor</div>
          <h1>{setor.nome}</h1>
        </div>
      </div>
      <div className="filtros">
        <div className="seg" role="tablist" aria-label="Áreas do setor">
          {ABAS.map(([k, t]) => (
            <button key={k} role="tab" aria-pressed={aba === k} aria-selected={aba === k} onClick={() => { setAba(k); setMsg(null) }}>
              {t}
              {k === 'demandas' && abertas > 0 ? ` (${abertas})` : ''}
              {k === 'plano' && meusPlanos.length > 0 ? ` (${meusPlanos.length})` : ''}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <BotaoPdf tipo="setor" base={base} setorId={perfil.setor} comentarios={selecionados} />
      </div>
      {msg && <div className={'aviso ' + msg.c} role="status">{msg.t}</div>}

      {aba === 'geral' && (
        <VisaoGeral
          perfil={perfil}
          base={base}
          setor={setor}
          meusPlanos={meusPlanos}
          selecionados={selecionados}
          onAlternar={alternar}
          onEnviado={() => {
            setSelecionados([])
            mudou(null)
          }}
        />
      )}
      {aba === 'demandas' && (
        <Demandas perfil={perfil} base={base} demandas={demandas} meusPlanos={meusPlanos} selecionados={selecionados} onMudou={mudou} onCriado={() => setSelecionados([])} />
      )}
      {aba === 'plano' && <PlanoSetor perfil={perfil} base={base} planos={meusPlanos} onMudou={mudou} onNovo={() => setAba('geral')} />}
    </>
  )
}

function VisaoGeral({ perfil, base, setor, meusPlanos, selecionados, onAlternar, onEnviado }) {
  const nota = Number(setor.nota)
  const ranking = [...base.setores].sort((a, b) => Number(b.nota) - Number(a.nota))
  const posicao = ranking.findIndex((s) => s.id === setor.id)
  const perguntas = base.setorPerguntas.filter((p) => p.setor_id === setor.id)
  const piores = [...perguntas].sort((a, b) => Number(a.nota) - Number(b.nota)).slice(0, 2)
  const top = ranking.slice(0, 3)

  return (
    <>
      <section className="card escuro nu-hero">
        <Anel valor={nota} max={5} rotulo={setor.nome} />
        <div className="meio">
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Meu setor · {setor.nome}</div>
          <div className="num" style={{ fontSize: 22, lineHeight: 1.25 }}>Nota {fmtNota(nota)}</div>
          <div className="small muted">Escala de 1 a 5 · média ponderada das respostas dos alunos</div>
        </div>
        <div className="minis">
          <div className="nu-mini"><span className="n">{posicao + 1}º</span><span className="l">de {ranking.length} setores</span></div>
          <div className="nu-mini"><span className="n">{perguntas.length}</span><span className="l">perguntas avaliadas</span></div>
        </div>
      </section>

      <Fluxo planos={meusPlanos} titulo="Fluxo dos meus planos de melhoria" />

      {piores.length > 0 && (
        <section className="card">
          <div className="card-h"><div className="t"><h2>Pontos a melhorar no meu setor</h2></div></div>
          <div className="nu-auto">
            {piores.map((p) => (
              <div key={p.pergunta} className="card nu-card" style={{ background: 'var(--ember-soft)', borderColor: 'var(--ember-soft)' }}>
                <span className="eyebrow" style={{ color: 'var(--ember-ink)' }}>Oportunidade</span>
                <b style={{ fontSize: 15 }}>{p.pergunta}</b>
                <span className="num" style={{ fontSize: 32, color: 'var(--ember-ink)' }}>{fmtNota(Number(p.nota))}</span>
                <span className="small">Item com menor avaliação dentro do seu setor. Vale priorizar no plano de melhoria.</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid2">
        <section className="card">
          <div className="card-h"><div className="t"><h2>Top 3 setores mais bem avaliados</h2></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top.map((s, i) => (
              <LinhaRank key={s.id} s={s} i={i} total={ranking.length} meu={s.id === setor.id} />
            ))}
            {posicao >= 3 && (
              <>
                <span className="small muted" style={{ textAlign: 'center' }}>…</span>
                <LinhaRank s={setor} i={posicao} total={ranking.length} meu />
              </>
            )}
          </div>
        </section>
        <section className="card">
          <div className="card-h"><div className="t"><h2>Detalhamento completo por pergunta</h2></div></div>
          <div>
            {perguntas.length === 0 && <Vazio>Sem perguntas avaliadas para este setor.</Vazio>}
            {perguntas.map((p) => (
              <div key={p.pergunta} className="nu-linha">
                <span style={{ fontWeight: 600 }}>{p.pergunta}</span>
                <BarraNota v={Number(p.nota)} fina />
                <span className="num" style={{ fontSize: 18, textAlign: 'right' }}>{fmtNota(Number(p.nota))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ComentariosInfra setorId={setor.id} selecionados={selecionados} onAlternar={onAlternar} />

      <FormPlano perfil={perfil} base={base} escopo={[]} tipo="setor" comentarios={selecionados} onRemoverComentario={onAlternar} onEnviado={onEnviado} />
    </>
  )
}

function LinhaRank({ s, i, total, meu }) {
  return (
    <div className={'nu-rank' + (meu ? ' destaque' : '')}>
      <span className={'pos ' + rankClasseSetor(i, total)}>{i + 1}</span>
      <span className="nm">{s.nome}{meu ? ' (seu setor)' : ''}</span>
      <span className="num" style={{ fontSize: 20 }}>{fmtNota(Number(s.nota))}</span>
    </div>
  )
}

// Fluxo (kanban) dos planos pelo caminho da aprovação
export function Fluxo({ planos, titulo }) {
  if (!planos.length) return null
  return (
    <section className="card">
      <div className="card-h"><div className="t"><h2>{titulo}</h2></div></div>
      <div className="nu-fluxo">
        {COLUNAS_FLUXO.map((col) => {
          const itens = planos.filter((p) => col.s.includes(p.status))
          return (
            <div key={col.t} className="nu-col">
              <div className="cab-col"><span>{col.t}</span><span className="selo cinza">{itens.length}</span></div>
              {itens.length === 0 && <span className="small muted">Nenhum item aqui.</span>}
              {itens.map((p) => (
                <div key={p.id} className="nu-cartao" style={{ borderLeftColor: col.cor }}>
                  {p.titulo}
                  {p.prazo && <div className="prazo">Prazo: {fmtData(p.prazo)}</div>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Comentários do questionário de Infraestrutura e Atendimento, com busca e seleção para o plano
function ComentariosInfra({ setorId, selecionados, onAlternar }) {
  const [busca, setBusca] = useState('')
  const [ativa, setAtiva] = useState('')
  const [sentimento, setSentimento] = useState('')
  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState({ chave: null })
  const chave = JSON.stringify([ativa, sentimento, pagina])
  const res = estado.chave === chave ? estado.res : null
  const erro = estado.chave === chave ? estado.erro : null
  const sugestao = PALAVRAS_SETOR[setorId]

  useEffect(() => {
    let vivo = true
    buscarComentarios({ categoria: INFRA, sentimento: sentimento || null, busca: ativa, pagina, porPagina: 10 })
      .then((r) => vivo && setEstado({ chave, res: r }))
      .catch((e) => vivo && setEstado({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave, ativa, sentimento, pagina])

  // Busca enquanto digita, com uma pequena espera (como o sistema anterior)
  useEffect(() => {
    const t = setTimeout(() => {
      setAtiva(busca.trim())
      setPagina(0)
    }, 350)
    return () => clearTimeout(t)
  }, [busca])

  return (
    <section className="card">
      <div className="card-h">
        <div className="t">
          <h2>Comentários gerais do questionário de Infraestrutura e Atendimento</h2>
          <p className="muted small">
            São os comentários de todo o questionário de Infraestrutura (um mesmo comentário pode falar de vários setores). Use a busca para achar o que é
            do seu setor e clique nos comentários que quiser anexar ao plano de melhoria.
          </p>
        </div>
      </div>
      <div className="filtros">
        <div className="seg" role="group" aria-label="Tipo de comentário">
          {[['', 'Todos'], ['warn', 'Pedem atenção'], ['bad', 'Negativos'], ['good', 'Positivos']].map(([k, t]) => (
            <button key={k} aria-pressed={sentimento === k} onClick={() => { setSentimento(k); setPagina(0) }}>{t}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="ms-busca">Buscar nos comentários</label>
        <input
          id="ms-busca"
          type="search"
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Palavras-chave separadas por vírgula, ex.: manutenção, ar condicionado, sala de aula"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {sugestao && busca !== sugestao && (
          <button className="btn sm" onClick={() => setBusca(sugestao)} title={sugestao}>Usar palavras sugeridas</button>
        )}
        {res && <span className="small muted">{fmtInt(res.total)} comentários</span>}
      </div>
      {selecionados.length > 0 && (
        <div className="aviso ok">{selecionados.length} comentário(s) selecionado(s) para anexar ao plano. Veja no formulário abaixo.</div>
      )}
      <Erro erro={erro} />
      {!res && !erro && <Carregando texto="Buscando comentários…" />}
      {res && !res.itens.length && <Vazio>Nenhum comentário encontrado com essas palavras.</Vazio>}
      {res?.itens.map((c) => {
        const txt = textoComentario(c.texto)
        const sel = selecionados.includes(txt)
        return (
          <button key={c.id} type="button" className="coment nu-coment" aria-pressed={sel} onClick={() => onAlternar(txt)}>
            <p>{txt}</p>
            <span className="meta">
              <span className={'selo ' + (SENTIMENTO[c.sentimento]?.selo || 'cinza')}>{SENTIMENTO[c.sentimento]?.rotulo || 'Comentário'}</span>
              <span>{sel ? 'Selecionado para o plano · clique para tirar' : 'Clique para anexar ao plano'}</span>
            </span>
          </button>
        )
      })}
      {res && <Paginacao pagina={pagina} total={res.total} porPagina={10} onPagina={setPagina} />}
    </section>
  )
}

function Demandas({ perfil, base, demandas, meusPlanos, selecionados, onMudou, onCriado }) {
  const [editando, setEditando] = useState(null)
  return (
    <section className="card">
      <div className="card-h">
        <div className="t">
          <h2>Demandas encaminhadas por coordenadores</h2>
          <p className="muted small">Ações de planos de curso que dependem do seu setor. Crie um item do seu plano de melhoria a partir de cada demanda, ou marque-a como atendida.</p>
        </div>
      </div>
      {demandas.length === 0 && <Vazio>Nenhuma demanda encaminhada por coordenadores até o momento.</Vazio>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {demandas.map((d) => {
          const filho = meusPlanos.find((p) => p.origem_plano_id === d.id)
          return (
            <ItemPlano
              key={d.id}
              p={d}
              perfil={perfil}
              base={base}
              onMudou={onMudou}
              contexto={
                d.atendido_pelo_setor ? (
                  <p className="small" style={{ color: 'var(--green-ink)', fontWeight: 600 }}>
                    Assumida pelo setor{filho ? ` · virou o item "${filho.titulo}" do plano de melhoria` : ''}.
                  </p>
                ) : (
                  <div>
                    <button type="button" className="btn sm escuro" onClick={() => setEditando(d)}>Editar e criar plano de melhoria a partir desta demanda</button>
                  </div>
                )
              }
            />
          )
        })}
      </div>
      {editando && (
        <ModalDemanda
          perfil={perfil}
          base={base}
          demanda={editando}
          comentarios={selecionados}
          onFechar={() => setEditando(null)}
          onCriado={() => {
            setEditando(null)
            onCriado()
            onMudou('Item do plano de melhoria criado a partir da demanda e enviado para análise. A demanda já aparece como assumida pelo setor.')
          }}
        />
      )}
    </section>
  )
}

function ModalDemanda({ perfil, base, demanda, comentarios, onFechar, onCriado }) {
  const curso = base.cursos.find((c) => c.id === demanda.curso_id)
  const [f, setF] = useState({
    titulo: demanda.titulo || '',
    descricao: (demanda.descricao || '') + (demanda.queixa_aluno ? '\n\nQueixa do aluno relatada originalmente: ' + demanda.queixa_aluno : ''),
    indicador: '',
    prioridade: demanda.prioridade || 'Média',
    prazo: demanda.prazo || '',
  })
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    if (ocupado) return
    if (!f.titulo.trim() || !f.descricao.trim() || !f.prazo) return setErro('Preencha ao menos o título, a descrição e o prazo da ação.')
    setOcupado(true)
    setErro(null)
    try {
      await criarPlanoDaDemanda(perfil, demanda, f, comentarios)
      onCriado()
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Criar plano de melhoria a partir da demanda" onFechar={onFechar}>
      <p className="small muted">Demanda de {rotuloCurso(curso) || 'curso'}. Complete a melhoria identificada, ajuste o prazo e envie: o item já vai para análise.</p>
      <div className="campo"><label htmlFor="md-t">Título da ação</label><input id="md-t" value={f.titulo} onChange={set('titulo')} /></div>
      <div className="campo">
        <label htmlFor="md-d">Descrição detalhada</label>
        <textarea id="md-d" className="input" rows={6} value={f.descricao} onChange={set('descricao')} style={{ height: 'auto', padding: 12 }} />
      </div>
      <div className="campo"><label htmlFor="md-i">Como o sucesso será medido (indicador)</label><input id="md-i" value={f.indicador} onChange={set('indicador')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="campo">
          <label htmlFor="md-p">Prioridade</label>
          <select id="md-p" value={f.prioridade} onChange={set('prioridade')}>{PRIORIDADES.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <div className="campo"><label htmlFor="md-z">Prazo de entrega</label><input id="md-z" type="date" value={f.prazo} onChange={set('prazo')} /></div>
      </div>
      {comentarios.length > 0 && <p className="small">{comentarios.length} comentário(s) selecionado(s) na Visão geral serão anexados a este item.</p>}
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn escuro" disabled={ocupado} onClick={salvar}>{ocupado ? 'Enviando…' : 'Enviar plano'}</button>
        <button className="btn" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}

function PlanoSetor({ perfil, base, planos, onMudou, onNovo }) {
  const porId = useMemo(() => Object.fromEntries(base.planos.map((p) => [p.id, p])), [base.planos])
  return (
    <section className="card">
      <div className="card-h">
        <div className="t">
          <h2>Plano de melhoria do setor</h2>
          <p className="muted small">Cada item enviado já vai para análise. Você pode editar até a aprovação.</p>
        </div>
        <div className="spacer" />
        <button className="btn sm escuro" onClick={onNovo}>Novo item</button>
        <BotaoPdf tipo="meuPlano" base={base} perfil={perfil} />
      </div>
      {planos.length === 0 && <Vazio>Nenhum item registrado ainda.</Vazio>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {planos.map((p) => {
          const origem = p.origem_plano_id ? porId[p.origem_plano_id] : null
          const cursoOrigem = origem ? base.cursos.find((c) => c.id === origem.curso_id) : null
          return (
            <ItemPlano
              key={p.id}
              p={p}
              perfil={perfil}
              base={base}
              onMudou={onMudou}
              contexto={p.origem_plano_id ? <p className="small muted">Criado a partir de uma demanda{cursoOrigem ? ` de ${rotuloCurso(cursoOrigem)}` : ''}{origem ? `: "${origem.titulo}"` : ''}.</p> : null}
            />
          )
        })}
      </div>
    </section>
  )
}
