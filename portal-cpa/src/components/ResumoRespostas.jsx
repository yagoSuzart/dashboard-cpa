// Análise rica do CSV de Respostas, por modelo de oferta: funil de conclusão, semestre, curso (Presencial),
// horários, tempo para responder, abandono, comentários e turmas de entrada. Só agregados.
import { useState } from 'react'
import { MODALIDADES_AO_VIVO, fmtNum } from '../lib/aoVivo.js'

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const pc = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0)
const nota = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const dm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const corNota = (v) => (v == null ? undefined : v >= 4.3 ? '#1c6db3' : v >= 4 ? '#3f86c9' : v >= 3.5 ? '#c26a10' : '#c2410c')

function Barras({ itens, rotulo, valor, cor = 'var(--navy)', destaque }) {
  const max = Math.max(...itens.map(valor), 1)
  return (
    <div className="rr-barras">
      {itens.map((it, i) => (
        <div key={i} className="rr-b" title={`${rotulo(it, i)}: ${fmtNum(valor(it))}`}>
          <span className="rr-v">{valor(it) ? fmtNum(valor(it)) : ''}</span>
          <i style={{ height: (valor(it) / max) * 100 + '%', background: destaque?.(it, i) ? '#e0791b' : cor }} />
          <span className="rr-r">{rotulo(it, i)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ResumoRespostas({ resumo, nomeCurso = (id) => id }) {
  const mods = MODALIDADES_AO_VIVO.filter((m) => resumo?.[m.k])
  const [mod, setMod] = useState(mods[0]?.k)
  if (!mods.length) return null
  const r = resumo[mod] || resumo[mods[0].k]
  const picoHora = r.horas.indexOf(Math.max(...r.horas))
  const picoDia = r.por_dia.reduce((m, d) => (d.n > (m?.n || 0) ? d : m), null)
  const nComent = Object.values(r.comentarios || {}).reduce((s, n) => s + n, 0)
  const nAband = Object.values(r.abandono || {}).reduce((s, n) => s + n, 0)
  const pesqs = [...new Set([...Object.keys(r.tempo_mediano || {}), ...Object.keys(r.comentarios || {}), ...Object.keys(r.abandono || {})])].sort()

  return (
    <div className="rr">
      {mods.length > 1 && (
        <div className="seg" role="group" aria-label="Modelo de oferta">
          {mods.map((m) => <button key={m.k} aria-pressed={(resumo[mod] ? mod : mods[0].k) === m.k} onClick={() => setMod(m.k)}>{m.t}</button>)}
        </div>
      )}

      <div className="rr-kpis">
        <div><b>{fmtNum(r.alunos)}</b><span>alunos responderam</span></div>
        <div><b>{fmtNum(r.concluiram_tudo)}</b><span>concluíram os {r.questionarios} questionários ({pc(r.concluiram_tudo, r.alunos)}%)</span></div>
        <div><b>{fmtNum(nComent)}</b><span>comentários escritos</span></div>
        <div><b>{fmtNum(nAband)}</b><span>questionários iniciados e não concluídos</span></div>
        {r.periodo && <div><b>{dm(r.periodo.inicio)} a {dm(r.periodo.fim)}</b><span>período das respostas</span></div>}
      </div>

      <div className="rr-grade">
        <section className="rr-card">
          <h4>Funil de conclusão</h4>
          <p className="small muted">Quantos alunos concluíram 0, 1, 2… dos {r.questionarios} questionários.</p>
          <Barras itens={r.funil} valor={(n) => n} rotulo={(_, i) => String(i)} destaque={(_, i) => i < r.questionarios} />
          <p className="small muted">Em laranja: quem começou e ainda pode ser lembrado de terminar ({fmtNum(r.alunos - r.concluiram_tudo)} alunos).</p>
        </section>

        <section className="rr-card">
          <h4>Respostas por dia</h4>
          <p className="small muted">Questionários concluídos em cada dia{picoDia ? ` · pico em ${dm(picoDia.dia)} (${fmtNum(picoDia.n)})` : ''}.</p>
          <Barras itens={r.por_dia} valor={(d) => d.n} rotulo={(d) => dm(d.dia)} />
        </section>

        <section className="rr-card">
          <h4>Horário em que respondem</h4>
          <p className="small muted">Pico às {picoHora}h: o melhor horário para lembrar os alunos.</p>
          <Barras itens={r.horas} valor={(n) => n} rotulo={(_, i) => (i % 3 === 0 ? i + 'h' : '')} destaque={(_, i) => i === picoHora} />
        </section>

        <section className="rr-card">
          <h4>Dia da semana</h4>
          <p className="small muted">Questionários concluídos em cada dia da semana.</p>
          <Barras itens={r.semana} valor={(n) => n} rotulo={(_, i) => SEMANA[i]} />
        </section>
      </div>

      <section className="rr-card">
        <h4>Por questionário</h4>
        <table className="tabela">
          <thead><tr><th>Questionário</th><th className="n">Tempo mediano</th><th className="n">Não concluídos</th><th className="n">Comentários</th></tr></thead>
          <tbody>
            {pesqs.map((p) => (
              <tr key={p}><td>{p}</td><td className="n">{r.tempo_mediano?.[p] != null ? `${String(r.tempo_mediano[p]).replace('.', ',')} min` : '—'}</td><td className="n">{fmtNum(r.abandono?.[p] || 0)}</td><td className="n">{fmtNum(r.comentarios?.[p] || 0)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {r.semestres?.length > 0 && (
        <section className="rr-card">
          <h4>Por semestre do aluno</h4>
          <table className="tabela">
            <thead><tr><th>Semestre</th><th className="n">Alunos</th><th className="n">Concluíram tudo</th><th className="n">Média geral (1 a 5)</th></tr></thead>
            <tbody>
              {r.semestres.map((s) => (
                <tr key={s.semestre ?? 'x'}><td>{s.semestre ? `${s.semestre}º` : 'Sem semestre'}</td><td className="n">{fmtNum(s.alunos)}</td><td className="n">{fmtNum(s.concluiram)} · {pc(s.concluiram, s.alunos)}%</td><td className="n" style={{ color: corNota(s.media), fontWeight: 700 }}>{nota(s.media)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {r.cursos?.length > 0 && (
        <section className="rr-card">
          <h4>Por curso</h4>
          <p className="small muted">O curso de cada aluno vem das respostas dele no questionário Docente. Média de 1 a 5 de cada questionário.</p>
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>Curso</th><th className="n">Alunos</th><th className="n">Concluíram tudo</th><th className="n">Média geral</th>{Object.keys(r.cursos[0]?.medias || {}).length > 0 && [...new Set(r.cursos.flatMap((c) => Object.keys(c.medias)))].sort().map((p) => <th key={p} className="n">{p}</th>)}</tr></thead>
              <tbody>
                {r.cursos.map((c) => {
                  const cols = [...new Set(r.cursos.flatMap((x) => Object.keys(x.medias)))].sort()
                  return (
                    <tr key={c.curso_id}>
                      <td>{nomeCurso(c.curso_id)}</td><td className="n">{fmtNum(c.alunos)}</td><td className="n">{pc(c.concluiram, c.alunos)}%</td>
                      <td className="n" style={{ color: corNota(c.media), fontWeight: 700 }}>{nota(c.media)}</td>
                      {cols.map((p) => <td key={p} className="n" style={{ color: corNota(c.medias[p]) }}>{nota(c.medias[p])}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {r.entradas?.length > 0 && (
        <section className="rr-card">
          <h4>Por turma de entrada (coluna Período)</h4>
          <div className="rr-ent">{r.entradas.map((e) => <span key={e.codigo}><b>{e.codigo}</b> {fmtNum(e.alunos)} alunos</span>)}</div>
        </section>
      )}
    </div>
  )
}
