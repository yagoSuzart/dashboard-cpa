// Plano de melhoria em PDF: pesquisa o curso, marca a modalidade (modelo de oferta) e gera o PDF só do que marcou.
// O PDF traz o panorama em notas do curso e, logo abaixo, os planos de ação aprovados (sem comentários).
// Cada pessoa vê só os cursos do próprio recorte (o coordenador, os dele; a CPA, todos).
import { useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { Vazio } from '../components/ui.jsx'
import './planos.css'

const APROVADOS = ['aprovado', 'concluido']
const ORDEM_MOD = { PRESENCIAL: 0, SEMIPRESENCIAL: 1, EAD: 2 }
const sem = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function PlanoMelhoria({ base, escopo, planos }) {
  const [busca, setBusca] = useState('')
  const [marcados, setMarcados] = useState([])
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)

  // Cursos do recorte, agrupados pelo nome, com as modalidades e quantos planos aprovados cada uma tem
  const grupos = useMemo(() => {
    const ids = new Set(escopo)
    const aprovados = {}
    for (const p of planos) if (APROVADOS.includes(p.status) && (p.tipo || 'curso') !== 'setor') aprovados[p.curso_id] = (aprovados[p.curso_id] || 0) + 1
    const porNome = new Map()
    for (const c of base.cursos) {
      if (!ids.has(c.id)) continue
      if (!porNome.has(c.nome)) porNome.set(c.nome, [])
      porNome.get(c.nome).push({ ...c, n: aprovados[c.id] || 0 })
    }
    return [...porNome.entries()]
      .map(([nome, cursos]) => ({ nome, cursos: cursos.sort((a, b) => (ORDEM_MOD[a.modalidade] ?? 9) - (ORDEM_MOD[b.modalidade] ?? 9)) }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [base.cursos, escopo, planos])

  const termo = sem(busca.trim())
  const visiveis = termo ? grupos.filter((g) => sem(g.nome).includes(termo)) : grupos
  const nomeDe = (id) => {
    const c = base.cursos.find((x) => x.id === id)
    return c ? `${c.nome} · ${MODALIDADE_LABEL[c.modalidade] || c.modalidade}` : id
  }
  const alternar = (id) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  async function gerar() {
    if (!marcados.length || ocupado) return
    setOcupado(true)
    setAviso({ tipo: '', texto: 'Gerando o PDF…' })
    try {
      const pdf = await import('../lib/pdf.js')
      const msg = await pdf.baixarPdfPlanoMelhoria({
        base, planos, cursoIds: marcados,
        onProgresso: (feitos, total, nome) =>
          total > 1 && setAviso({ tipo: '', texto: feitos < total ? `Gerando ${feitos + 1} de ${total}: ${nome}… Deixe esta aba aberta.` : 'Juntando os PDFs num ZIP…' }),
      })
      setAviso({ tipo: 'ok', texto: msg })
    } catch (e) {
      if (/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(e?.message || '')) {
        setAviso({ tipo: '', texto: 'O Portal foi atualizado. Recarregando a página… depois é só gerar de novo.' })
        setTimeout(() => location.reload(), 1200)
        return
      }
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível gerar o PDF agora.' })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Planos · plano de melhoria</div>
          <h1>Plano de melhoria em PDF.</h1>
          <p className="muted">Pesquise o curso e marque o modelo de oferta. O PDF traz o panorama em notas do curso e, logo abaixo, os planos de ação aprovados.</p>
        </div>
      </section>

      <section className="card pm-busca">
        <label htmlFor="pm-busca" className="small muted">Pesquisar curso</label>
        <input id="pm-busca" className="input" type="search" placeholder="Digite o nome do curso" value={busca} onChange={(e) => setBusca(e.target.value)} autoComplete="off" />
      </section>

      <section className="card" style={{ gap: 0, padding: 0 }}>
        {!visiveis.length && <div style={{ padding: 20 }}><Vazio>Nenhum curso encontrado com “{busca}”.</Vazio></div>}
        {visiveis.map((g) => (
          <div key={g.nome} className="pm-linha">
            <b className="pm-nome">{g.nome}</b>
            <div className="pm-mods" role="group" aria-label={'Modalidades de ' + g.nome}>
              {g.cursos.map((c) => (
                <button key={c.id} type="button" className="pm-mod" aria-pressed={marcados.includes(c.id)} onClick={() => alternar(c.id)}>
                  <span className="pm-check" aria-hidden="true">{marcados.includes(c.id) ? '✓' : ''}</span>
                  <span>{MODALIDADE_LABEL[c.modalidade] || c.modalidade}</span>
                  <small>{c.n ? `${c.n} ${c.n === 1 ? 'plano' : 'planos'}` : 'sem plano aprovado'}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="pm-barra" aria-live="polite">
        <div className="pm-sel">
          {marcados.length ? (
            <>
              <b>{marcados.length === 1 ? nomeDe(marcados[0]) : `${marcados.length} cursos selecionados`}</b>
              <span className="small muted">{marcados.length === 1 ? 'Um PDF' : 'Um PDF por curso, num ZIP'}</span>
            </>
          ) : (
            <span className="muted">Marque o curso e o modelo de oferta.</span>
          )}
        </div>
        {marcados.length > 0 && <button type="button" className="btn" onClick={() => { setMarcados([]); setAviso(null) }} disabled={ocupado}>Limpar</button>}
        <button type="button" className="btn escuro" onClick={gerar} disabled={!marcados.length || ocupado}>{ocupado ? 'Gerando…' : 'Gerar PDF'}</button>
      </div>
      {aviso && <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.texto}</div>}
    </>
  )
}
