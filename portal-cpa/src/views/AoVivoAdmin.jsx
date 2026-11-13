// Atualizar os números da CPA (só admin e Coordenação da CPA): sobe os CSVs "Respondentes por curso" do painel da
// avaliação (um por modelo de oferta), confere os cursos com o cadastro do Portal e publica o panorama aberto.
// Opcional: o CSV "Respostas" gera o ranking de professores, que só a coordenação de cada curso vê.
import { useEffect, useMemo, useState } from 'react'
import {
  MODALIDADES_AO_VIVO, carregarConfig, conferir, fmtNum, fmtPct, lerCsvProfessores, lerCsvRespondentes, montarDados, pct,
  publicarPanorama, publicarProfessores, salvarConfig, ultimaPublicacao,
} from '../lib/aoVivo.js'
import './aoVivo.css'

const SITUACAO = {
  ok: { t: 'Confere com o cadastro', c: 'ok' },
  fora: { t: 'Não existe nesta modalidade', c: 'fora' },
  repetido: { t: 'Veio também em outra modalidade', c: 'rep' },
  duplicado: { t: 'Nome repetido nesta modalidade', c: 'rep' },
}

export default function AoVivoAdmin({ base }) {
  const [ciclo, setCiclo] = useState('2026.2')
  const [csv, setCsv] = useState({})
  const [config, setConfig] = useState(null)
  // Números dos cards do painel: o geral (filtro "Todos") e o de cada modelo de oferta (filtro de cada um)
  const [numeros, setNumeros] = useState(() => Object.fromEntries(['geral', ...MODALIDADES_AO_VIVO.map((m) => m.k)].map((k) => [k, { elegiveis: '', concluidos: '', iniciados: '' }])))
  const [prof, setProf] = useState(null)
  const [lendoProf, setLendoProf] = useState(null)
  const [soFora, setSoFora] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [ultima, setUltima] = useState(null)

  useEffect(() => {
    carregarConfig().then(setConfig).catch(() => setConfig({}))
    ultimaPublicacao()
      .then((u) => {
        setUltima(u)
        if (u?.dados) {
          const pega = (x) => (x ? { elegiveis: x.elegiveis ?? '', concluidos: x.concluidos ?? '', iniciados: x.iniciados ?? '' } : null)
          setNumeros((n) => ({
            ...n,
            geral: pega(u.dados.geral) || n.geral,
            ...Object.fromEntries(MODALIDADES_AO_VIVO.map(({ k }) => [k, pega(u.dados.modalidades?.[k]?.painel) || n[k]])),
          }))
        }
        if (u?.ciclo) setCiclo(u.ciclo)
      })
      .catch(() => {})
  }, [])

  const conferido = useMemo(() => (config ? conferir(csv, base.cursos, config) : {}), [csv, base.cursos, config])
  const temCsv = Object.keys(csv).length > 0

  async function escolher(mod, arquivo) {
    setAviso(null)
    if (!arquivo) return
    try {
      const linhas = await lerCsvRespondentes(arquivo)
      setCsv((c) => ({ ...c, [mod]: linhas }))
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message })
    }
  }

  async function escolherRespostas(arquivo) {
    if (!arquivo) return
    setAviso(null)
    setLendoProf(0)
    try {
      setProf(await lerCsvProfessores(arquivo, base.cursos, setLendoProf))
    } catch (e) {
      setAviso({ tipo: 'erro', texto: 'Não foi possível ler o CSV de respostas: ' + e.message })
    } finally {
      setLendoProf(null)
    }
  }

  const decidir = (r, inclui) => setConfig((c) => ({ ...c, decisoes: { ...(c.decisoes || {}), [r.chave]: inclui } }))
  const ajustarElegiveis = (r, v) =>
    setConfig((c) => {
      const el = { ...(c.elegiveis || {}) }
      const k = `${r.mod}|${r.cursoId}`
      if (v === '' || Number(v) === r.elegiveis) delete el[k]
      else el[k] = Number(v)
      return { ...c, elegiveis: el }
    })

  // Sugere os números gerais pela soma dos CSVs quando ainda não foram preenchidos
  const somaCsv = useMemo(() => {
    const todas = Object.values(csv).flat()
    return { elegiveis: todas.reduce((s, r) => s + r.elegiveis, 0), concluidos: todas.reduce((s, r) => s + r.concluidos, 0), iniciados: todas.reduce((s, r) => s + r.iniciados, 0) }
  }, [csv])

  async function publicar() {
    const nums = (x) => ({ elegiveis: Number(x.elegiveis) || 0, concluidos: Number(x.concluidos) || 0, iniciados: Number(x.iniciados) || 0 })
    const g = nums(numeros.geral)
    if (!g.elegiveis || !g.concluidos) {
      setAviso({ tipo: 'erro', texto: 'Preencha os números gerais do painel (elegíveis e concluíram tudo).' })
      return
    }
    const porMod = Object.fromEntries(MODALIDADES_AO_VIVO.map(({ k }) => [k, nums(numeros[k])]).filter(([, v]) => v.elegiveis > 0))
    setOcupado(true)
    setAviso({ tipo: '', texto: 'Publicando…' })
    try {
      await salvarConfig(config)
      await publicarPanorama(ciclo, montarDados(conferido, base.cursos, g, porMod))
      if (prof?.professores?.length) await publicarProfessores(ciclo, prof.professores)
      const u = await ultimaPublicacao()
      setUltima(u)
      setAviso({ tipo: 'ok', texto: 'Publicado! A página aberta já mostra os números novos' + (prof?.professores?.length ? ` e o ranking de ${prof.professores.length} professores foi atualizado para a coordenação.` : '.') })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: 'Não foi possível publicar: ' + (e.message || e) })
    } finally {
      setOcupado(false)
    }
  }

  if (!config) return <p className="muted">Carregando…</p>

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">CPA · números parciais</div>
          <h1>Atualizar os números da CPA.</h1>
          <p className="muted">Suba os CSVs do painel da avaliação, confira os cursos e publique. A página aberta mostra a data e a hora de cada atualização. Só você e a Coordenação da CPA veem esta tela; a página aberta mostra só o que for publicado.</p>
        </div>
        <div className="spacer" />
        <a className="btn" href="#/panorama" target="_blank" rel="noreferrer">Ver a página aberta ↗</a>
      </section>
      {ultima && <div className="aviso">Última publicação: ciclo {ultima.ciclo}, em {new Date(ultima.publicado_em).toLocaleString('pt-BR')}.</div>}

      <section className="card av-passo">
        <h2><span>1</span>CSVs "Respondentes por curso"</h2>
        <p className="muted">No painel da avaliação, clique no modelo de oferta (filtro no topo), desça até "Respondentes por curso" e clique em <b>Baixar CSV</b> (o arquivo começa com <b>respondentes-cpa</b>). Repita para os três.</p>
        <div className="av-arquivos">
          {MODALIDADES_AO_VIVO.map(({ k, t }) => (
            <label key={k} className={'av-arq' + (csv[k] ? ' ok' : '')}>
              <b>{t}</b>
              <span className="small muted">{csv[k] ? `${csv[k].length} cursos lidos` : 'Escolher o CSV'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e) => escolher(k, e.target.files[0])} />
            </label>
          ))}
        </div>
        <label className="campo" style={{ maxWidth: 200 }}>
          <span className="small muted">Ciclo</span>
          <input className="input" value={ciclo} onChange={(e) => setCiclo(e.target.value)} />
        </label>
      </section>

      <section className="card av-passo">
        <h2><span>2</span>Números do painel</h2>
        <p className="muted">Copie os cards do topo do painel: primeiro com o filtro "Todos" e depois com cada modelo de oferta. Os pontos de milhar entram sozinhos. {temCsv && `Pela soma dos CSVs: ${fmtNum(somaCsv.elegiveis)} elegíveis, ${fmtNum(somaCsv.concluidos)} concluíram.`}</p>
        <div className="av-numeros">
          {[{ k: 'geral', t: 'UniFECAF (Todos)' }, ...MODALIDADES_AO_VIVO].map(({ k, t }) => (
            <div key={k} className={'av-num-linha' + (k === 'geral' ? ' geral' : '')}>
              <b>{t}</b>
              {[['elegiveis', 'Elegíveis'], ['concluidos', 'Concluíram tudo'], ['iniciados', 'Em andamento']].map(([c, rot]) => (
                <label key={c} className="campo">
                  <span className="small muted">{rot}</span>
                  <NumeroInput valor={numeros[k][c]} onValor={(v) => setNumeros((n) => ({ ...n, [k]: { ...n[k], [c]: v } }))} />
                </label>
              ))}
            </div>
          ))}
        </div>
        <p className="small muted">Se deixar um modelo de oferta em branco, a página usa a soma dos cursos do CSV dele.</p>
      </section>

      {temCsv && (
        <section className="card av-passo">
          <h2><span>3</span>Conferência dos cursos</h2>
          <p className="muted">Cursos que não existem no cadastro daquela modalidade, ou que vieram repetidos de outra, já ficam de fora. Você pode marcar e desmarcar, e trocar os elegíveis (por exemplo, pelos ativos do BI). O Portal lembra das suas escolhas nas próximas atualizações.</p>
          <label className="av-filtro"><input type="checkbox" checked={soFora} onChange={(e) => setSoFora(e.target.checked)} /> Mostrar só os cursos que ficam de fora</label>
          {MODALIDADES_AO_VIVO.filter(({ k }) => conferido[k]?.length).map(({ k, t }) => {
            const linhas = conferido[k].filter((r) => !soFora || !r.inclui)
            const dentro = conferido[k].filter((r) => r.inclui).length
            return (
              <details key={k} className="av-mod" open={soFora}>
                <summary><b>{t}</b> <span className="small muted">· {dentro} de {conferido[k].length} cursos entram · {conferido[k].length - dentro} ficam de fora (clique para conferir)</span></summary>
                <div className="rolagem">
                  <table className="tabela av-tab">
                    <thead><tr><th>Entra</th><th>Curso no CSV</th><th>Situação</th><th className="n">Elegíveis</th><th className="n">Concluídos</th><th className="n">Adesão</th></tr></thead>
                    <tbody>
                      {linhas.map((r) => {
                        const el = r.elegAjustado || r.elegiveis
                        return (
                          <tr key={r.chave + r.concluidos} className={r.inclui ? '' : 'av-fora'}>
                            <td><input type="checkbox" checked={r.inclui} onChange={(e) => decidir(r, e.target.checked)} aria-label={'Incluir ' + r.nome} /></td>
                            <td>{r.nome}{r.outros.length > 0 && <span className="small muted"> · também no CSV de {r.outros.map((m) => MODALIDADES_AO_VIVO.find((x) => x.k === m)?.t).join(', ')}</span>}</td>
                            <td><span className={'av-sit ' + SITUACAO[r.status].c}>{SITUACAO[r.status].t}</span></td>
                            <td className="n">
                              {r.cursoId ? (
                                <input className="input av-num" type="number" min="1" defaultValue={el} onBlur={(e) => ajustarElegiveis(r, e.target.value)} title={r.elegAjustado ? `No painel: ${r.elegiveis}` : 'Elegíveis do painel'} />
                              ) : fmtNum(r.elegiveis)}
                            </td>
                            <td className="n">{fmtNum(r.concluidos)}</td>
                            <td className="n">{fmtPct(pct(r.concluidos, el))}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            )
          })}
        </section>
      )}

      <section className="card av-passo">
        <h2><span>4</span>Professores <span className="small muted">(opcional · só a coordenação vê)</span></h2>
        <p className="muted">O CSV "Respostas" do painel (botão Exportar → Respostas; o arquivo começa com <b>respostas-cpa</b>) gera a média de cada professor no questionário Docente, por curso. Do arquivo só saem médias e contagens; códigos de aluno e comentários não são enviados.</p>
        <label className={'av-arq' + (prof ? ' ok' : '')} style={{ maxWidth: 360 }}>
          <b>CSV de respostas</b>
          <span className="small muted">{lendoProf != null ? `Lendo… ${Math.round(lendoProf * 100)}%` : prof ? `${fmtNum(prof.professores.length)} professores em ${new Set(prof.professores.map((p) => p.curso_id)).size} cursos` : 'Escolher o CSV'}</span>
          <input type="file" accept=".csv,text/csv" onChange={(e) => escolherRespostas(e.target.files[0])} />
        </label>
        {prof && Object.keys(prof.semCurso).length > 0 && (
          <p className="small muted">Cursos do CSV sem correspondência no cadastro (ficam de fora): {Object.keys(prof.semCurso).join(', ')}.</p>
        )}
      </section>

      <div className="av-publicar">
        {aviso && <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.texto}</div>}
        <button className="btn escuro" disabled={ocupado || (!temCsv && !prof)} onClick={publicar}>{ocupado ? 'Publicando…' : 'Publicar atualização'}</button>
      </div>
    </>
  )
}

// Campo de número com ponto de milhar automático (58853 → 58.853). Guarda só os dígitos.
function NumeroInput({ valor, onValor }) {
  const txt = valor === '' || valor == null ? '' : Number(valor).toLocaleString('pt-BR')
  return (
    <input
      className="input"
      inputMode="numeric"
      value={txt}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 9)
        onValor(d === '' ? '' : Number(d))
      }}
    />
  )
}
