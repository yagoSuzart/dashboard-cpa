// Atualizar os números da CPA (só admin e Coordenação da CPA): sobe os CSVs "Respondentes por curso" do painel da
// avaliação (um por modelo de oferta), confere os cursos com o cadastro do Portal e publica o panorama aberto.
// Opcional: o CSV "Respostas" gera o ranking de professores, que só a coordenação de cada curso vê.
import { useEffect, useMemo, useState } from 'react'
import {
  MODALIDADES_AO_VIVO, carregarConfig, conferir, fmtNum, fmtPct, lerCsvRespondentes, lerCsvRespostas, mesclarEvolucao, montarDados, pct,
  publicarPanorama, publicarProfessores, publicarRespostas, salvarConfig, ultimaPublicacao,
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
  const [arqResp, setArqResp] = useState([])
  const [respMod, setRespMod] = useState({})
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
      // CSV de Respostas da modalidade: fica nesta caixa e entra junto com o geral do passo 4
      if (e.respostas) {
        const novo = { ...respMod, [mod]: arquivo }
        setRespMod(novo)
        await lerRespostas(novo, arqResp)
      } else setAviso({ tipo: 'erro', texto: e.message })
    }
  }

  // Junta os CSVs de Respostas de cada modalidade (passo 1) com os gerais (passo 4); cada resposta conta uma vez
  async function lerRespostas(porMod, gerais) {
    const origens = [...Object.keys(porMod), ...gerais.map(() => 'geral')]
    const lista = [...Object.values(porMod), ...gerais]
    if (!lista.length) { setProf(null); return }
    setLendoProf(0)
    try {
      const r = await lerCsvRespostas(lista, base.cursos, setLendoProf)
      // Arquivo na caixa errada (sem nenhuma resposta daquela modalidade): sai e avisa
      const erradas = origens.filter((o, i) => o !== 'geral' && !r.porArquivo[i]?.porMod[o])
      if (erradas.length) {
        const nome = (k) => MODALIDADES_AO_VIVO.find((m) => m.k === k)?.t
        setAviso({ tipo: 'erro', texto: erradas.map((k) => `O arquivo "${porMod[k].name}" não tem respostas de ${nome(k)} (traz ${Object.keys(r.porArquivo[origens.indexOf(k)].porMod).map(nome).join(', ') || 'nada'}). Escolha o CSV de Respostas de ${nome(k)} nessa caixa.`).join(' ') })
        const certo = Object.fromEntries(Object.entries(porMod).filter(([k]) => !erradas.includes(k)))
        setRespMod(certo)
        await lerRespostas(certo, gerais)
        return
      }
      setProf({ ...r, origens })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: 'Não foi possível ler o CSV de respostas: ' + e.message })
    } finally {
      setLendoProf(null)
    }
  }

  // Passo 4: os CSVs gerais se acumulam; o mesmo nome substitui o anterior
  async function escolherRespostas(novos) {
    if (!novos?.length) return
    setAviso(null)
    const lista = [...arqResp.filter((a) => !novos.some((n) => n.name === a.name)), ...novos]
    setArqResp(lista)
    await lerRespostas(respMod, lista)
  }

  // Resumo de um arquivo de Respostas lido (alunos e respostas por modalidade)
  const resumoDe = (k) => prof?.porArquivo?.[prof.origens?.indexOf(k)]
  // Comparação: arquivo de cada modalidade (passo 1) x arquivos gerais (passo 4)
  const comparacao = useMemo(() => {
    if (!prof?.porArquivo || !prof.origens) return []
    const gerais = prof.porArquivo.filter((_, i) => prof.origens[i] === 'geral')
    if (!gerais.length) return []
    return MODALIDADES_AO_VIVO.filter(({ k }) => prof.origens.includes(k)).map(({ k, t }) => {
      const m = prof.porArquivo[prof.origens.indexOf(k)]?.porMod[k] || { linhas: 0, alunos: 0 }
      const g = gerais.reduce((acc, a) => (a.porMod[k] && a.porMod[k].alunos > acc.alunos ? a.porMod[k] : acc), { linhas: 0, alunos: 0 })
      return { k, t, m, g }
    })
  }, [prof])

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
    if (temCsv && (!g.elegiveis || !g.concluidos)) {
      setAviso({ tipo: 'erro', texto: 'Preencha os números gerais do painel (elegíveis e concluíram tudo).' })
      return
    }
    const porMod = Object.fromEntries(MODALIDADES_AO_VIVO.map(({ k }) => [k, nums(numeros[k])]).filter(([, v]) => v.elegiveis > 0))
    setOcupado(true)
    setAviso({ tipo: '', texto: 'Publicando…' })
    try {
      await salvarConfig(config)
      // A curva dia a dia vem do CSV de Respostas (as modalidades que não vieram ficam como estavam); sem ele, mantém a anterior
      const anterior = ultima?.dados?.evolucao || null
      const evolucao = prof?.evolucao?.length ? mesclarEvolucao(prof.evolucao, anterior, prof.modalidades) : anterior
      if (temCsv) await publicarPanorama(ciclo, montarDados(conferido, base.cursos, g, porMod, evolucao))
      else if (ultima?.dados) {
        // Sem os CSVs de Respondentes: mantém o ranking dos cursos da última publicação, mas usa os números do passo 2
        const modalidades = { ...(ultima.dados.modalidades || {}) }
        for (const [k, v] of Object.entries(porMod)) modalidades[k] = { ...(modalidades[k] || {}), ...v, painel: v }
        await publicarPanorama(ciclo, { ...ultima.dados, ...(g.elegiveis ? { geral: g } : {}), modalidades, ...(evolucao ? { evolucao } : {}) })
      }
      if (prof?.professores?.length) await publicarProfessores(ciclo, prof.professores)
      if (prof?.perguntas?.length) await publicarRespostas(ciclo, prof)
      const u = await ultimaPublicacao()
      setUltima(u)
      const partes = [temCsv ? 'a página aberta já mostra os números novos' : 'a página aberta já mostra os números do passo 2 (o ranking dos cursos continua o da última publicação)']
      if (prof?.professores?.length) partes.push(`o ranking de ${prof.professores.length} professores foi atualizado para a coordenação`)
      if (prof?.perguntas?.length) partes.push(`as respostas pergunta por pergunta de ${prof.modalidades.map((k) => MODALIDADES_AO_VIVO.find((m) => m.k === k)?.t).join(', ')} estão em "Respostas parciais"`)
      setAviso({ tipo: 'ok', texto: 'Publicado! ' + partes.join('; ') + '.' })
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
        <h2><span>1</span>CSVs de cada modelo de oferta</h2>
        <p className="muted">No painel da avaliação, clique no modelo de oferta (filtro no topo) e baixe: <b>Respondentes por curso</b> (Baixar CSV, arquivo <b>respondentes-cpa</b>) e/ou <b>Respostas</b> (Exportar → Respostas, arquivo <b>respostas-cpa</b>). Cada caixa aceita os dois: escolha um e depois o outro. Repita para os três modelos de oferta.</p>
        <div className="av-arquivos">
          {MODALIDADES_AO_VIVO.map(({ k, t }) => {
            const r = resumoDe(k)
            const outras = r ? Object.keys(r.porMod).filter((x) => x !== k) : []
            return (
              <label key={k} className={'av-arq' + (csv[k] || respMod[k] ? ' ok' : '')}>
                <b>{t}</b>
                <span className="small muted">{csv[k] ? `Respondentes: ${csv[k].length} cursos lidos` : 'Respondentes por curso: escolher'}</span>
                <span className="small muted">{respMod[k] ? (lendoProf != null ? 'Respostas: lendo…' : r?.porMod[k] ? `Respostas: ${fmtNum(r.porMod[k].alunos)} alunos · ${fmtNum(r.porMod[k].linhas)} linhas` : 'Respostas: lido') : 'Respostas: escolher'}</span>
                {outras.length > 0 && <span className="small av-alerta">Este arquivo também traz {outras.map((x) => MODALIDADES_AO_VIVO.find((m) => m.k === x)?.t).join(', ')}: confira se é o de {t}.</span>}
                <input type="file" accept=".csv,text/csv" onChange={(e) => { escolher(k, e.target.files[0]); e.target.value = '' }} />
              </label>
            )
          })}
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
        <h2><span>4</span>Respostas gerais, professores e evolução <span className="small muted">(opcional)</span></h2>
        <p className="muted">O CSV "Respostas" geral do painel (filtro <b>Todos</b> → Exportar → Respostas; arquivo <b>respostas-cpa</b>). Ele entra junto com os CSVs de Respostas de cada modelo de oferta do passo 1: cada resposta conta uma vez só, e a tabela abaixo compara os arquivos. Gera as respostas pergunta por pergunta (tela "Respostas parciais" e página aberta), a média de cada professor (só a coordenação vê) e a curva dia a dia. Do arquivo só saem contagens e médias; códigos de aluno e comentários não são enviados.</p>
        <label className={'av-arq' + (prof ? ' ok' : '')} style={{ maxWidth: 420 }}>
          <b>CSV de respostas geral</b>
          <span className="small muted">{lendoProf != null ? `Lendo… ${Math.round(lendoProf * 100)}%` : prof ? `${prof.modalidades.map((k) => MODALIDADES_AO_VIVO.find((m) => m.k === k)?.t).join(', ')} · ${fmtNum(prof.linhas)} respostas · ${new Set(prof.perguntas.map((q) => q.modalidade + q.pesquisa)).size} questionários · ${fmtNum(prof.professores.length)} professores` : 'Escolher o CSV (ou vários)'}</span>
          <input type="file" multiple accept=".csv,text/csv" onChange={(e) => { escolherRespostas([...e.target.files]); e.target.value = '' }} />
        </label>
        {arqResp.length > 0 && (
          <p className="small muted">Arquivos: {arqResp.map((a) => a.name).join(' · ')}{' '}
            <button className="av-limpar" onClick={() => { setArqResp([]); lerRespostas(respMod, []) }}>limpar</button>
          </p>
        )}
        {comparacao.length > 0 && (
          <div className="rolagem">
            <table className="tabela av-tab">
              <thead><tr><th>Modelo de oferta</th><th className="n">Arquivo da modalidade (passo 1)</th><th className="n">Arquivo geral (passo 4)</th><th>Situação</th></tr></thead>
              <tbody>
                {comparacao.map(({ k, t, m, g }) => {
                  const dif = m.alunos - g.alunos
                  return (
                    <tr key={k}>
                      <td><b>{t}</b></td>
                      <td className="n">{fmtNum(m.alunos)} alunos · {fmtNum(m.linhas)} linhas</td>
                      <td className="n">{g.alunos ? `${fmtNum(g.alunos)} alunos · ${fmtNum(g.linhas)} linhas` : 'não veio no geral'}</td>
                      <td>{!g.alunos ? <span className="av-sit rep">Só no arquivo da modalidade</span> : dif === 0 && m.linhas === g.linhas ? <span className="av-sit ok">Confere</span> : <span className="av-sit rep">{dif > 0 ? `+${fmtNum(dif)}` : fmtNum(dif)} alunos no da modalidade</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="small muted">Diferença costuma ser horário de exportação (um arquivo baixado antes do outro). Na publicação, os dois entram juntos e cada resposta conta uma vez.</p>
          </div>
        )}
        {prof?.repetidas > 0 && <p className="small muted">{fmtNum(prof.repetidas)} respostas repetidas (o mesmo aluno na mesma pergunta, em novas tentativas ou em mais de um arquivo) foram contadas uma vez só.</p>}
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
