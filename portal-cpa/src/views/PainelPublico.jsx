// Página aberta do Portal (sem login): os números parciais da CPA em andamento — respondentes, adesão e ranking por curso em cada
// modelo de oferta —, as notas gerais do ciclo anterior e os números dos planos de ação. Só agregados: comentários,
// professores e planos detalhados ficam depois do login (botão "Área do coordenador · Entrar").
import { useEffect, useMemo, useState } from 'react'
import { MODALIDADES_AO_VIVO, carregarPublico, fmtNum, fmtPct, pct } from '../lib/aoVivo.js'
import { DIMENSOES, SATISFACAO } from '../lib/config.js'
import GraficoEvolucao from '../components/GraficoEvolucao.jsx'
import RespostasPublicas from '../components/RespostasPublicas.jsx'
import ColabAoVivo from '../components/ColabAoVivo.jsx'
import HeroColab from '../components/HeroColab.jsx'
import { useColabAoVivo } from '../lib/colabPublico.js'
import './painelPublico.css'

const TOP = 5
// Modalidade publicada, mas sem respondentes por curso (o painel ainda não separa): mostra aviso em vez de zeros
const semPorCurso = (lista) => lista.length > 0 && lista.every((c) => !c.concluidos && !c.iniciados)
const dataHora = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const nota = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

export default function PainelPublico({ logado = false }) {
  const [d, setD] = useState(null)
  const [erro, setErro] = useState(false)
  const [modo, setModo] = useState('adesao') // adesao | alunos
  const [aberto, setAberto] = useState({})
  const [topo, setTopo] = useState('alunos') // alunos | colab
  const colab = useColabAoVivo()

  useEffect(() => {
    let vivo = true
    carregarPublico().then((x) => vivo && setD(x)).catch(() => vivo && setErro(true))
    return () => { vivo = false }
  }, [])

  const av = d?.ao_vivo
  const g = av?.dados?.geral
  const mods = useMemo(() => av?.dados?.modalidades || {}, [av])
  const ranking = useMemo(() => {
    const out = {}
    for (const { k } of MODALIDADES_AO_VIVO) {
      const lista = (mods[k]?.cursos || []).map((c) => ({ ...c, adesao: pct(c.concluidos, c.elegiveis) }))
      lista.sort((a, b) => (modo === 'adesao' ? b.adesao - a.adesao || b.concluidos - a.concluidos : b.concluidos - a.concluidos || b.adesao - a.adesao))
      out[k] = lista
    }
    return out
  }, [mods, modo])

  const hist = d?.historico
  const dims = DIMENSOES.map((k) => ({ k, nota: hist?.dimensoes?.find((x) => x.categoria === k)?.nota }))
  const satisfacao = hist?.dimensoes?.find((x) => x.categoria === SATISFACAO)?.nota
  const temHist = dims.some((x) => x.nota != null)
  const entrar = logado ? '#/inicio' : '#/entrar'

  return (
    <div className="pp">
      <header className="pp-topo">
        <div className="pp-w">
          <div className="pp-barra">
            <img src="/logo-unifecaf-branco.png" alt="UniFECAF" />
            <span className="pp-sep" /><span className="pp-nm">PORTAL CPA</span>
            <span className="pp-esp" />
            <a className="pp-bt pp-sec" href="/perguntas/">Perguntas da próxima CPA</a>
            <a className="pp-bt pp-lima" href={entrar}>Área do coordenador · Entrar</a>
          </div>
          <nav className="pp-menu" aria-label="Seções">
            <a href="#ao-vivo" onClick={(e) => { e.preventDefault(); document.getElementById('ao-vivo')?.scrollIntoView({ behavior: 'smooth' }) }}>Ranking dos cursos</a>
            {av?.dados?.evolucao?.length > 0 && <a href="#evolucao" onClick={(e) => { e.preventDefault(); document.getElementById('evolucao')?.scrollIntoView({ behavior: 'smooth' }) }}>Evolução</a>}
            {d?.respostas?.perguntas?.length > 0 && <a href="#respostas" onClick={(e) => { e.preventDefault(); document.getElementById('respostas')?.scrollIntoView({ behavior: 'smooth' }) }}>O que os alunos dizem</a>}
            <a href="#placar" onClick={(e) => { e.preventDefault(); document.getElementById('placar')?.scrollIntoView({ behavior: 'smooth' }) }}>Placar por modelo de oferta</a>
            {temHist && <a href="#historico" onClick={(e) => { e.preventDefault(); document.getElementById('historico')?.scrollIntoView({ behavior: 'smooth' }) }}>Resultados {hist.ciclo}</a>}
            <a href="#colaboradores" onClick={(e) => { e.preventDefault(); document.getElementById('colaboradores')?.scrollIntoView({ behavior: 'smooth' }) }}>Docentes e ADM <span className="cv-tag">ao vivo</span></a>
            <a href="#acao" onClick={(e) => { e.preventDefault(); document.getElementById('acao')?.scrollIntoView({ behavior: 'smooth' }) }}>Do resultado à ação</a>
          </nav>
        </div>
      </header>

      <section className="pp-hero">
        <div className="pp-w pp-hero-g">
          <div>
            {av && <span className="pp-selo"><i />CPA {av.ciclo} em andamento</span>}
            <h1>A voz da comunidade <span>acadêmica</span>, em números.</h1>
            <p className="pp-l">Quantos alunos já responderam, os cursos que mais participam e o que cada coordenação faz com as respostas.</p>
            <div className="pp-ctas">
              <a className="pp-bt pp-lima" href="#ao-vivo" onClick={(e) => { e.preventDefault(); document.getElementById('ao-vivo')?.scrollIntoView({ behavior: 'smooth' }) }}>Ver o ranking dos cursos</a>
              <a className="pp-bt" href={entrar}>Entrar no Portal</a>
            </div>
          </div>
          <div className="pp-vivo">
            <div className="hc-abas" role="tablist" aria-label="Quem está avaliando">
              <button role="tab" aria-selected={topo === 'alunos'} onClick={() => setTopo('alunos')}>Alunos</button>
              <button role="tab" aria-selected={topo === 'colab'} onClick={() => setTopo('colab')}>Docentes e ADM <span className="cv-tag">ao vivo</span></button>
            </div>
            {topo === 'colab' ? (
              <HeroColab d={colab} />
            ) : erro ? (
              <p className="pp-mut">Não foi possível carregar os números agora. Tente de novo em instantes.</p>
            ) : !d ? (
              <p className="pp-mut">Carregando…</p>
            ) : !g ? (
              <p className="pp-mut">Os números da avaliação aparecem aqui assim que a CPA publicar a primeira atualização.</p>
            ) : (
              <>
                <h3>Parcial da CPA {av.ciclo}</h3>
                <div className="pp-big">{fmtNum(g.concluidos)}<small>concluíram tudo</small></div>
                <span className="pp-big-sub">{fmtPct(pct(g.concluidos, g.elegiveis))} dos {fmtNum(g.elegiveis)} alunos elegíveis</span>
                <div className="pp-prog" aria-hidden="true">
                  <i style={{ width: pct(g.concluidos, g.elegiveis) + '%', background: 'var(--pp-lima)' }} />
                  <i style={{ width: pct(g.iniciados, g.elegiveis) + '%', background: '#f0a33a' }} />
                </div>
                <div className="pp-leg">
                  <span><i style={{ background: 'var(--pp-lima)' }} />Concluíram <b>{fmtNum(g.concluidos)}</b> ({fmtPct(pct(g.concluidos, g.elegiveis))})</span>
                  <span><i style={{ background: '#f0a33a' }} />Em andamento <b>{fmtNum(g.iniciados)}</b></span>
                  <span><i style={{ background: '#2a3b66' }} />Elegíveis <b>{fmtNum(g.elegiveis)}</b></span>
                </div>
                <div className="pp-andam"><b>+{fmtNum(g.iniciados)}</b> alunos começaram e ainda não terminaram</div>
                <div className="pp-mini">
                  {MODALIDADES_AO_VIVO.map(({ k, t }) => (
                    <div key={k}><small>{t.toUpperCase()}</small><b>{fmtNum(mods[k]?.concluidos || 0)}</b><span className="and">+{fmtNum(mods[k]?.iniciados || 0)} em andamento</span></div>
                  ))}
                </div>
                <p className="pp-atual">Números atualizados em {dataHora(av.publicado_em)} · a CPA atualiza algumas vezes por dia</p>
              </>
            )}
          </div>
        </div>
      </section>
      <div className="pp-faixa">Ainda dá tempo! A avaliação da CPA ainda está disponível no UniFECAF ONE · responda e faça a sua voz virar ação.</div>
      <ColabAoVivo d={colab} />

      {g && (
        <>
          {av.dados.evolucao?.length > 0 && (
            <section className="pp-s pp-evol" id="evolucao">
              <div className="pp-w">
                <div className="pp-eb">Evolução · CPA {av.ciclo}</div>
                <h2>Quanto falta para todos responderem?</h2>
                <p className="pp-sub">Alunos que concluíram todos os questionários, dia a dia, em relação aos elegíveis. O topo do gráfico (100%) são todos os {fmtNum(g.elegiveis)} alunos.</p>
                <div className="pp-card pp-grafico">
                  <GraficoEvolucao pontos={av.dados.evolucao} series={MODALIDADES_AO_VIVO}
                    base={{ total: g.elegiveis, ...Object.fromEntries(MODALIDADES_AO_VIVO.map(({ k }) => [k, mods[k]?.elegiveis || 0])) }} />
                </div>
              </div>
            </section>
          )}
          <section className="pp-s" id="ao-vivo">
            <div className="pp-w">
              <div className="pp-eb">CPA {av.ciclo} · ranking de {dataHora(av.dados.ranking_em || av.publicado_em)}</div>
              <h2>Quem está na frente?</h2>
              <p className="pp-sub">Ranking dos cursos em cada modelo de oferta. Adesão é o percentual de alunos do curso que já concluíram a avaliação.</p>
              <div className="pp-abas" role="tablist" aria-label="Ordenar o ranking">
                <button role="tab" aria-selected={modo === 'adesao'} onClick={() => setModo('adesao')}>Por adesão %</button>
                <button role="tab" aria-selected={modo === 'alunos'} onClick={() => setModo('alunos')}>Por nº de alunos</button>
              </div>
              <div className="pp-grid3">
                {MODALIDADES_AO_VIVO.map(({ k, t, cor }) => {
                  const lista = ranking[k] || []
                  const todos = aberto[k]
                  const max = Math.max(...lista.map((c) => (modo === 'adesao' ? c.adesao : c.concluidos)), 1)
                  return (
                    <div key={k} className="pp-card">
                      <h4>{t}<small>{lista.length} cursos</small></h4>
                      {!lista.length && <p className="pp-mut">Sem cursos publicados nesta modalidade.</p>}
                      {semPorCurso(lista) ? (
                        <p className="pp-mut pp-aguarda">{fmtNum((mods[k]?.concluidos || 0) + (mods[k]?.iniciados || 0))} alunos já começaram no {t}. O ranking por curso aparece assim que o painel separar os respondentes por curso.</p>
                      ) : (
                      <ol className="pp-rk">
                        {(todos ? lista : lista.slice(0, TOP)).map((c, i) => {
                          const v = modo === 'adesao' ? c.adesao : c.concluidos
                          return (
                            <li key={c.id + i} className={i < 3 ? 'pod p' + (i + 1) : ''}>
                              <span className="n">{i + 1}</span>
                              <span className="c">{c.nome}</span>
                              <b>{modo === 'adesao' ? fmtPct(c.adesao) : fmtNum(c.concluidos)}</b>
                              <span className="t"><i style={{ width: (v / max) * 100 + '%', background: cor }} /></span>
                              <small>{fmtNum(c.concluidos)} de {fmtNum(c.elegiveis)} alunos</small>
                            </li>
                          )
                        })}
                      </ol>
                      )}
                      {!semPorCurso(lista) && lista.length > TOP && (
                        <button className="pp-mais" onClick={() => setAberto((a) => ({ ...a, [k]: !todos }))}>
                          {todos ? 'Mostrar só o top 5' : `Ver os ${lista.length} cursos →`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          {d.respostas?.perguntas?.length > 0 && (
            <section className="pp-s rpp" id="respostas">
              <div className="pp-w">
                <div className="pp-eb">O que os alunos dizem · CPA {d.respostas.ciclo}</div>
                <h2>Como os alunos estão avaliando a <span>UniFECAF</span>.</h2>
                <p className="pp-sub">Cada pergunta da avaliação, com a distribuição das notas e a média, em cada modelo de oferta.</p>
                <RespostasPublicas r={d.respostas} />
              </div>
            </section>
          )}

          <section className="pp-s pp-escuro" id="placar">
            <div className="pp-w">
              <div className="pp-eb">Placar</div>
              <h2>Qual modelo de oferta participa mais?</h2>
              <div className="pp-placar">
                {[{ k: 'geral', t: 'UniFECAF', cor: '#ffffff', ...g }, ...MODALIDADES_AO_VIVO.map((m) => ({ ...m, ...(mods[m.k] || {}) }))].map((m) => {
                  const a = pct(m.concluidos || 0, m.elegiveis || 0)
                  return (
                    <div key={m.k} className={'pp-card pp-pl' + (m.k === 'geral' ? ' geral' : '')}>
                      <Donut valor={a} cor={m.k === 'geral' ? 'var(--pp-lima)' : m.cor} />
                      <div>
                        <h4 style={{ display: 'block' }}>{m.t}</h4>
                        <p className="pp-mut">{fmtNum(m.concluidos || 0)} de {fmtNum(m.elegiveis || 0)} alunos concluíram</p>
                        {m.iniciados > 0 && <p className="pp-mut">+{fmtNum(m.iniciados)} em andamento</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {temHist && (
        <section className="pp-s" id="historico">
          <div className="pp-w">
            <div className="pp-eb">Histórico · CPA {hist.ciclo}</div>
            <h2>Como os alunos avaliaram a UniFECAF.</h2>
            <p className="pp-sub">Média da UniFECAF por dimensão, de 1 a 5{hist.respondentes ? `, com ${fmtNum(hist.respondentes)} alunos respondentes` : ''}. Meta: 4,0.</p>
            <div className="pp-hist">
              <div className="pp-card">
                <h4>Nota por dimensão<small>meta 4,0</small></h4>
                <div className="pp-dim">
                  {dims.filter((x) => x.nota != null).map((x) => (
                    <div key={x.k}>
                      <span>{x.k}</span><b>{nota(x.nota)}</b>
                      <span className="t"><i style={{ width: (Number(x.nota) / 5) * 100 + '%', background: Number(x.nota) >= 4 ? 'var(--pp-lima)' : '#f0a33a' }} /><em style={{ left: '80%' }} /></span>
                    </div>
                  ))}
                </div>
              </div>
              {satisfacao != null && (
                <div className="pp-card pp-sat">
                  <h4>Satisfação geral<small>0 a 10</small></h4>
                  <div className="pp-big">{nota(satisfacao)}</div>
                  <p className="pp-mut">O quanto os alunos recomendam a UniFECAF.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pp-s" id="acao">
        <div className="pp-w">
          <div className="pp-eb">Do resultado à ação</div>
          <h2>O que a avaliação virou em melhoria.</h2>
          <p className="pp-sub">Cada coordenação transforma as respostas em planos de ação, analisados pela CPA e aprovados pela Pró-Reitoria.</p>
          {d?.planos && (
            <div className="pp-acao">
              <div className="pp-card"><b>{fmtNum(d.planos.aprovados)}</b><span>planos aprovados</span></div>
              <div className="pp-card"><b>{fmtNum(d.planos.concluidos)}</b><span>já concluídos</span></div>
              <div className="pp-card"><b>{fmtNum(d.planos.cursos)}</b><span>cursos com plano</span></div>
            </div>
          )}
          <div className="pp-entrar">
            <div><h3>É da coordenação ou da CPA?</h3><p>Entre no Portal para montar planos, acompanhar demandas e ver os resultados detalhados do seu curso.</p></div>
            <a className="pp-bt pp-lima" href={entrar}>Entrar no Portal</a>
          </div>
        </div>
      </section>
      <footer className="pp-rodape"><div className="pp-w"><span>CPA UniFECAF · Comissão Própria de Avaliação</span><span>Seu sonho, nossa meta!</span></div></footer>
    </div>
  )
}

function Donut({ valor, cor }) {
  const r = 34, c = 2 * Math.PI * r, len = (Math.min(valor, 100) / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={fmtPct(valor) + ' de adesão'}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#24345c" strokeWidth="12" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={cor} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} transform="rotate(-90 48 48)" strokeLinecap="round" />
      <text x="48" y="53" textAnchor="middle" fill="#eef3fb" fontFamily="Poppins" fontWeight="700" fontSize="16">{fmtPct(valor)}</text>
    </svg>
  )
}
