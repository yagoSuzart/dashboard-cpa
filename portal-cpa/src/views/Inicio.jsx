import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, SATISFACAO, TRILHO, STATUS_PLANO } from '../lib/config.js'
import { mediasPorDimensao, rotuloCurso, contarTrilho } from '../lib/escopo.js'
import { contarComentarios } from '../lib/dados.js'
import { fmtNota, fmtInt } from '../lib/cpa.js'
import { BarraNota, Anel, Erro } from '../components/ui.jsx'

const QUEM = {
  enviado: 'Esperando a primeira leitura',
  aguardando_coordenador: 'Planos da equipe em revisão pelo coordenador',
  aguardando_pro_reitoria: 'Aguardando a Pró-Reitoria',
  aprovado: 'Em execução no curso ou setor',
  concluido: 'Entregues e concluídos',
}

export default function Inicio({ perfil, base, escopo, planos }) {
  const { cursos, notas, setores } = base
  const [voz, setVoz] = useState(null)
  const [erro, setErro] = useState(null)
  const idsEscopoChave = escopo.join(',')

  useEffect(() => {
    let vivo = true
    contarComentarios(perfil.global ? {} : { cursos: idsEscopoChave.split(',').filter(Boolean) })
      .then((r) => vivo && setVoz(r))
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [perfil.global, idsEscopoChave])

  const medias = useMemo(() => mediasPorDimensao(notas, escopo), [notas, escopo])
  const planosAbertos = useMemo(() => {
    const m = {}
    for (const p of planos) if (!['concluido'].includes(p.status) && p.categoria) m[p.categoria] = (m[p.categoria] || 0) + 1
    return m
  }, [planos])
  const dims = DIMENSOES.map((d) => ({ d, v: medias[d] })).sort((a, b) => (a.v ?? 9) - (b.v ?? 9))
  const { c: trilho, devolvidos } = contarTrilho(planos)
  const porId = Object.fromEntries(cursos.map((c) => [c.id, c]))
  const atencao = escopo
    .map((id) => ({ c: porId[id], v: notas[id]?.[SATISFACAO] }))
    .filter((x) => x.c && x.v != null)
    .sort((a, b) => a.v - b.v)
    .slice(0, perfil.global ? 8 : 12)
  const totalVoz = voz ? voz.good + voz.warn + voz.bad : 0
  const pct = (x) => (totalVoz ? Math.round((x / totalVoz) * 100) : 0)

  const frase = perfil.global
    ? `${fmtInt(trilho.aguardando_coordenador)} planos estão com os coordenadores e ${fmtInt(trilho.enviado)} esperam a primeira leitura.`
    : escopo.length === 1
      ? `${rotuloCurso(porId[escopo[0]])}: ${fmtInt(planos.length)} planos de ação registrados.`
      : `Seus ${escopo.length} cursos têm ${fmtInt(planos.length)} planos de ação registrados.`

  return (
    <>
      <section className="grid-lado hero-inicio">
        <div className="cab">
          <div className="txt">
            <div className="eyebrow">{perfil.global ? 'Visão institucional' : 'Seus cursos'} · Pesquisa CPA</div>
            <h1>{saudacao()}. {frase}</h1>
            <div className="chips">
              <a className="btn escuro" href="#/planos">Ver os planos</a>
              <a className="btn" href="#/questionarios">Pergunta por pergunta</a>
            </div>
          </div>
        </div>
        <div className="card escuro" style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
          <Anel valor={medias[SATISFACAO]} rotulo="Satisfação geral" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow" style={{ color: '#9FE0B8' }}>Satisfação geral</div>
            <div className="num" style={{ fontSize: 22, lineHeight: 1.25 }}>Média de {escopo.length} {escopo.length === 1 ? 'curso' : 'cursos'}</div>
            <div className="small muted">Escala de 0 a 10</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Termômetro das dimensões</h2>
            <p className="muted small">Média simples dos cursos em cada dimensão (1 a 5). A linha tracejada é a meta de 4,0.</p>
          </div>
          <div className="spacer" />
          <div className="legenda">
            <span><i style={{ background: 'var(--ember)' }} />Abaixo da meta</span>
            <span><i style={{ background: 'var(--blue)' }} />Na meta ou acima</span>
          </div>
        </div>
        <div>
          {dims.map(({ d, v }) => (
            <div className="linha-dim" key={d}>
              <a className="nome" href={'#/questionarios'} style={{ color: 'inherit', textDecoration: 'none' }}>{d}</a>
              <BarraNota v={v} />
              <div className="num" style={{ fontSize: 24, textAlign: 'right' }}>{fmtNota(v)}</div>
              <div className="small extra" style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{fmtInt(planosAbertos[d] || 0)} planos em aberto</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Trilho dos planos</h2>
            <p className="muted small">
              Onde cada um dos {fmtInt(planos.length)} planos está no caminho até a conclusão.
              {devolvidos > 0 && ` ${fmtInt(devolvidos)} ${devolvidos === 1 ? 'foi devolvido' : 'foram devolvidos'} para ajuste.`}
            </p>
          </div>
        </div>
        <div className="etapas">
          {TRILHO.map((s, i) => (
            <a key={s} href={'#/planos/' + s} className={'etapa e' + (i + 1)} style={{ textDecoration: 'none' }}>
              <span className="n">{i + 1} · {STATUS_PLANO[s]}</span>
              <span className="q">{fmtInt(trilho[s])}</span>
              <span className="d">{QUEM[s]}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>Voz dos alunos</h2>
              <p className="muted small">{voz ? `${fmtInt(totalVoz)} comentários classificados.` : 'Contando os comentários…'}</p>
            </div>
            <div className="spacer" />
            <a className="btn sm" href="#/comentarios">Ler os comentários</a>
          </div>
          <Erro erro={erro} />
          {voz && (
            <>
              <div style={{ display: 'flex', height: 44, borderRadius: 12, overflow: 'hidden' }} aria-hidden="true">
                <div style={{ width: pct(voz.good) + '%', background: '#1C6DB3', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 14, fontWeight: 700 }}>{pct(voz.good)}%</div>
                <div style={{ width: pct(voz.warn) + '%', background: '#E7B75A', color: '#3A2A06', display: 'flex', alignItems: 'center', paddingLeft: 14, fontWeight: 700 }}>{pct(voz.warn)}%</div>
                <div style={{ width: pct(voz.bad) + '%', background: '#8E3413' }} />
              </div>
              <div className="grid3">
                <div className="kpi"><span className="v">{fmtInt(voz.good)}</span><span className="l">positivos</span></div>
                <div className="kpi"><span className="v">{fmtInt(voz.warn)}</span><span className="l">pedem atenção</span></div>
                <div className="kpi"><span className="v">{fmtInt(voz.bad)}</span><span className="l">negativos</span></div>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <div className="t">
              <h2>{perfil.global ? 'Cursos que pedem atenção' : 'Seus cursos'}</h2>
              <p className="muted small">Pela satisfação geral, da menor para a maior.</p>
            </div>
          </div>
          <div className="lista">
            {atencao.map(({ c, v }) => (
              <a key={c.id} className="item" href={'#/curso/' + c.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{rotuloCurso(c)}</span>
                <span className="num" style={{ fontSize: 20 }}>{fmtNota(v)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {perfil.global && (
        <section className="card">
          <div className="card-h">
            <div className="t">
              <h2>Setores</h2>
              <p className="muted small">Nota dos {setores.length} setores avaliados, do mais frágil ao mais forte.</p>
            </div>
            <div className="spacer" />
            <a className="btn sm" href="#/setores">Ver setores</a>
          </div>
          <div className="grid3 grid-setores">
            {[...setores].sort((a, b) => a.nota - b.nota).map((s) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 90px 44px', gap: 12, alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{s.nome}</span>
                <BarraNota v={Number(s.nota)} fina />
                <span className="num" style={{ fontSize: 18, textAlign: 'right' }}>{fmtNota(Number(s.nota))}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
