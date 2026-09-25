import { useEffect, useMemo, useState } from 'react'
import { rotuloCurso } from '../lib/escopo.js'
import { fmtNota } from '../lib/cpa.js'
import { buscarComentarios } from '../lib/dados.js'
import { DIMENSOES, SATISFACAO } from '../lib/config.js'
import { AREAS, CATEGORIAS_PLANO, MODELOS, PRIORIDADES, criarPlano, modeloSetor, statusDeEnvio } from '../lib/planos.js'

const VAZIO = { titulo: '', descricao: '', indicador: '', prioridade: 'Média', prazo: '', externa: false, area: 'nead', queixa_aluno: '', prazo_estimado: '' }

// Formulário do plano de ação. Sem rascunho: "Enviar" já manda para a análise
// (o plano do professor auxiliar vai antes para o coordenador do curso).
// tipo 'curso' (coordenação) ou 'setor' (responsável de setor).
export default function FormPlano({ perfil, base, escopo, tipo = 'curso', cursoInicial, categoriaInicial, comentarios = [], onRemoverComentario, onEnviado, titulo, mostrarSelecao = true }) {
  const cursos = useMemo(() => [...escopo].sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b))), [escopo])
  const [curso, setCurso] = useState(cursoInicial || cursos[0]?.id || '')
  const [cats, setCats] = useState(categoriaInicial ? [categoriaInicial] : [])
  const [f, setF] = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState(null)
  const cursoAtual = cursoInicial || curso
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const perguntasSetor = useMemo(() => base.setorPerguntas.filter((p) => p.setor_id === perfil.setor), [base.setorPerguntas, perfil.setor])
  const vaiPara = statusDeEnvio(perfil) === 'aguardando_coordenador' ? 'o coordenador do curso' : 'a análise da CPA'

  function usarModelo() {
    if (tipo === 'setor') {
      const m = modeloSetor(perguntasSetor)
      if (!m) return setMsg({ t: 'Não há dados suficientes do setor para sugerir um modelo.', c: 'erro' })
      setF({ ...f, ...m })
      return setMsg({ t: 'Modelo aplicado com base no ponto mais frágil do seu setor. Ajuste antes de enviar.', c: 'ok' })
    }
    if (!cats.length) return setMsg({ t: 'Marque ao menos uma dimensão para eu sugerir um modelo.', c: 'erro' })
    const m = MODELOS[cats[0]]
    if (!m) return setMsg({ t: 'Não há um modelo para essa dimensão ainda. Escreva livremente.', c: 'erro' })
    setF({ ...f, ...m })
    setMsg({ t: 'Modelo aplicado. Ajuste os campos à realidade do seu curso antes de enviar.', c: 'ok' })
  }

  async function enviar(e) {
    e.preventDefault()
    if (salvando) return
    if (!f.titulo.trim() || !f.descricao.trim() || !f.prazo) return setMsg({ t: 'Preencha ao menos o título, a descrição e o prazo de entrega.', c: 'erro' })
    if (tipo === 'curso' && !cursoAtual) return setMsg({ t: 'Escolha o curso do plano.', c: 'erro' })
    if (f.externa && !f.queixa_aluno.trim())
      return setMsg({ t: 'Descreva a queixa do aluno relacionada a este problema, para ajudar o setor responsável a entender a demanda.', c: 'erro' })
    setSalvando(true)
    setMsg(null)
    try {
      const novo = await criarPlano(perfil, {
        ...f,
        tipo,
        curso_id: cursoAtual,
        setor_id: perfil.setor,
        categoria: tipo === 'setor' ? null : cats.join(', ') || null,
        comentarios_selecionados: comentarios,
      })
      setF(VAZIO)
      if (!categoriaInicial) setCats([])
      setMsg({ t: `Plano enviado para ${vaiPara}. Você pode editar até ele ser aprovado.`, c: 'ok' })
      onEnviado?.(novo)
    } catch (err) {
      setMsg({ t: err.message, c: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="card" onSubmit={enviar} style={{ gap: 14 }}>
      <div className="card-h">
        <div className="t">
          <span className="eyebrow">Plano de ação</span>
          <h3 style={{ fontSize: 22 }}>{titulo || (tipo === 'setor' ? 'Novo item do plano de melhoria do setor' : 'Novo item do plano de ação')}</h3>
        </div>
        <div className="spacer" />
        <button type="button" className="btn sm" onClick={usarModelo}>{tipo === 'setor' ? 'Usar modelo do ponto mais frágil' : 'Usar modelo'}</button>
      </div>

      {tipo === 'curso' && !cursoInicial && (
        <div className="campo">
          <label htmlFor="fp-curso">Curso</label>
          <select id="fp-curso" value={curso} onChange={(e) => setCurso(e.target.value)}>
            {cursos.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
          </select>
        </div>
      )}
      {tipo === 'curso' && <Lembrete base={base} cursoId={cursoAtual} />}

      {tipo === 'curso' && !categoriaInicial && (
        <div className="campo">
          <label>Dimensões que o plano trata</label>
          <div className="chips">
            {CATEGORIAS_PLANO.map((c) => (
              <button key={c} type="button" className="chip-btn" aria-pressed={cats.includes(c)} onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {!mostrarSelecao ? null : comentarios.length > 0 ? (
        <div className="aviso ok" style={{ flexDirection: 'column', gap: 6 }}>
          <b>{comentarios.length} comentário(s) selecionado(s) · serão anexados como evidência deste plano</b>
          {onRemoverComentario && comentarios.map((c, i) => (
            <span key={i} className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ flex: 1, fontStyle: 'italic' }}>"{c.length > 180 ? c.slice(0, 180) + '…' : c}"</span>
              <button type="button" className="btn sm" style={{ height: 28 }} onClick={() => onRemoverComentario(c)}>Tirar</button>
            </span>
          ))}
        </div>
      ) : (
        onRemoverComentario && <p className="small muted">Nenhum comentário selecionado ainda. Clique nos comentários acima que quiser usar como base (opcional).</p>
      )}

      <div className="campo">
        <label htmlFor="fp-titulo">Título da ação</label>
        <input id="fp-titulo" value={f.titulo} onChange={set('titulo')} placeholder="Ex.: Melhorar este ponto com base nos comentários selecionados" />
      </div>
      <div className="campo">
        <label htmlFor="fp-desc">Descrição detalhada</label>
        <textarea id="fp-desc" className="input" rows={4} value={f.descricao} onChange={set('descricao')} placeholder="Descreva a ação planejada…" style={{ height: 'auto', padding: 12 }} />
      </div>
      <div className="campo">
        <label htmlFor="fp-ind">Como o sucesso será medido (indicador)</label>
        <input id="fp-ind" value={f.indicador} onChange={set('indicador')} />
      </div>
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="campo">
          <label htmlFor="fp-prio">Prioridade</label>
          <select id="fp-prio" value={f.prioridade} onChange={set('prioridade')}>
            {PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="fp-prazo">Prazo de entrega</label>
          <input id="fp-prazo" type="date" value={f.prazo} onChange={set('prazo')} />
        </div>
      </div>

      {tipo === 'curso' && (
        <>
          <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
            <input type="checkbox" checked={f.externa} onChange={set('externa')} />
            Esta ação depende de outra área (não está sob minha gestão direta)
          </label>
          {f.externa && (
            <div className="card" style={{ background: 'var(--paper-2)', gap: 12, padding: 16 }}>
              <div className="campo">
                <label htmlFor="fp-area">Área responsável</label>
                <select id="fp-area" value={f.area} onChange={set('area')}>
                  {AREAS.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="fp-queixa">Queixa do aluno relacionada</label>
                <textarea id="fp-queixa" className="input" rows={3} value={f.queixa_aluno} onChange={set('queixa_aluno')} style={{ height: 'auto', padding: 12 }} placeholder="O que os alunos relataram sobre isso, para o setor entender a demanda" />
              </div>
              <div className="campo">
                <label htmlFor="fp-pe">Prazo estimado pela área (não vinculante)</label>
                <input id="fp-pe" type="date" value={f.prazo_estimado} onChange={set('prazo_estimado')} />
              </div>
            </div>
          )}
        </>
      )}

      {msg && <div className={'aviso ' + msg.c} role="status">{msg.t}</div>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn escuro" disabled={salvando}>{salvando ? 'Enviando…' : 'Enviar plano'}</button>
        <span className="small muted">Vai direto para {vaiPara}. Você pode editar até a aprovação.</span>
      </div>
    </form>
  )
}

// Lembrete rápido do curso: satisfação geral, ponto mais frágil e um comentário crítico
function Lembrete({ base, cursoId }) {
  const [critico, setCritico] = useState({ chave: null, texto: null })
  const n = base.notas[cursoId] || {}
  const pior = DIMENSOES.filter((d) => n[d] != null).sort((a, b) => n[a] - n[b])[0]
  useEffect(() => {
    if (!cursoId) return
    let vivo = true
    buscarComentarios({ cursos: [cursoId], sentimento: 'bad', porPagina: 1 })
      .then((r) => vivo && setCritico({ chave: cursoId, texto: r.itens[0]?.texto || null }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [cursoId])
  if (!cursoId || !pior) return null
  const curso = base.cursos.find((c) => c.id === cursoId)
  return (
    <div className="aviso" style={{ flexDirection: 'column', gap: 4 }}>
      <b>Lembrete rápido · {rotuloCurso(curso)}</b>
      {n[SATISFACAO] != null && <span className="small">Satisfação Geral: {fmtNota(n[SATISFACAO], 1)} de 10</span>}
      <span className="small">Ponto mais frágil: {pior} ({fmtNota(n[pior])} de 5)</span>
      {critico.chave === cursoId && critico.texto && <span className="small" style={{ fontStyle: 'italic' }}>"{critico.texto}"</span>}
    </div>
  )
}
