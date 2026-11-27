// Análise rica do CSV "Respostas" do painel: tudo o que o arquivo permite tirar além das notas por pergunta.
// Roda no navegador, junto com a leitura do arquivo, e só devolve agregados (nenhum código de aluno sai daqui):
// - funil: quantos alunos concluíram 0, 1, 2… questionários do seu modelo de oferta;
// - semestre do aluno: participação, conclusão e média geral (1 a 5) por semestre;
// - curso (Presencial): o curso de cada aluno vem das linhas do Docente; com ele, média de cada questionário por curso;
// - quando os alunos respondem: conclusões por dia, hora e dia da semana;
// - tempo para responder: mediana de minutos entre "Iniciado Em" e "Concluído Em" de cada questionário;
// - turmas de entrada (coluna Período): alunos por turma;
// - abandono: questionários iniciados e não concluídos.

// "2026-11-10 14:32:11", "2026-11-10T14:32", "10/11/2026 14:32" → { dia, hora, semana, min } no horário do arquivo
export function lerDataHora(v) {
  const t = String(v || '')
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  let a, me, d, h, mi
  if (m) [, a, me, d, h, mi] = m
  else {
    m = t.match(/(\d{2})\/(\d{2})\/(\d{4})[ T,]*(\d{2}):(\d{2})/)
    if (!m) return null
    ;[, d, me, a, h, mi] = m
  }
  const ms = Date.UTC(+a, +me - 1, +d, +h, +mi)
  if (Number.isNaN(ms)) return null
  return { dia: `${a}-${me}-${d}`, hora: +h, semana: new Date(ms).getUTCDay(), min: ms / 60000 }
}

const mediana = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const i = Math.floor(s.length / 2)
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2
}
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100)

export function novoAcumulador() {
  return { porMod: {} }
}

function daMod(acc, mod) {
  return (acc.porMod[mod] ||= {
    semestre: new Map(), // aluno → semestre
    entrada: new Map(), // aluno → código do Período
    cursoVotos: new Map(), // aluno → Map(cursoId → linhas do Docente)
    notas: new Map(), // aluno → Map(pesquisa → [soma, n]) (1 a 5, sem "não sei")
    conclusao: new Map(), // `${aluno}|${pesq}` → { inicio, fim }
    comentarios: new Map(), // pesquisa → nº de comentários
    dias: new Set(),
  })
}

// Chamado para cada linha (já sem repetições). tipo: rating_scale | textarea
export function acumular(acc, { l, mod, pesq, aluno, concluiu, resp, tipo, cursoDocente }) {
  if (!mod || !pesq) return
  const m = daMod(acc, mod)
  if (aluno) {
    const sem = parseInt(l.Semestre, 10)
    if (Number.isInteger(sem) && sem > 0 && sem < 20 && !m.semestre.has(aluno)) m.semestre.set(aluno, sem)
    const per = String(l['Período'] || '').trim()
    if (per && !m.entrada.has(aluno)) m.entrada.set(aluno, per)
    if (cursoDocente) {
      const v = m.cursoVotos.get(aluno) || new Map()
      v.set(cursoDocente, (v.get(cursoDocente) || 0) + 1)
      m.cursoVotos.set(aluno, v)
    }
    if (tipo !== 'textarea') {
      const v = Number(resp)
      if (Number.isInteger(v) && v >= 1 && v <= 5 && !/satisfa/i.test(pesq)) {
        const pa = m.notas.get(aluno) || new Map()
        const sn = pa.get(pesq) || [0, 0]
        sn[0] += v
        sn[1]++
        pa.set(pesq, sn)
        m.notas.set(aluno, pa)
      }
    }
    const k = aluno + '|' + pesq
    if (!m.conclusao.has(k)) {
      const ini = lerDataHora(l['Iniciado Em'])
      const fim = concluiu ? lerDataHora(l['Concluído Em']) || lerDataHora(l['Respondido Em']) : null
      if (ini || fim) m.conclusao.set(k, { pesq, ini, fim })
    } else if (concluiu) {
      const c = m.conclusao.get(k)
      if (!c.fim) c.fim = lerDataHora(l['Concluído Em']) || lerDataHora(l['Respondido Em'])
    }
  }
  if (tipo === 'textarea' && String(resp || '').trim()) m.comentarios.set(pesq, (m.comentarios.get(pesq) || 0) + 1)
}

// alunos: Map(`${mod}|${aluno}` → { mod, feitas: Map(pesq → dia) }) da leitura principal
export function fechar(acc, alunos, pesquisasDaMod) {
  const out = {}
  const porAluno = {}
  for (const [k, a] of alunos) {
    const aluno = k.slice(k.indexOf('|') + 1)
    ;(porAluno[a.mod] ||= new Map()).set(aluno, a)
  }
  for (const [mod, m] of Object.entries(acc.porMod)) {
    const exigidas = pesquisasDaMod[mod] || new Set()
    const N = exigidas.size
    const lista = porAluno[mod] || new Map()
    const feitas = (a) => [...exigidas].filter((p) => a.feitas.get(p)).length
    const tudo = (a) => N > 0 && feitas(a) === N

    // Funil
    const funil = Array.from({ length: N + 1 }, () => 0)
    for (const a of lista.values()) funil[feitas(a)]++

    // Média geral do aluno (todas as notas 1 a 5 dele) e por questionário
    const mediaAluno = (al) => {
      const pa = m.notas.get(al)
      if (!pa) return null
      let s = 0, n = 0
      for (const [a, b] of pa.values()) { s += a; n += b }
      return n ? s / n : null
    }

    // Por semestre
    const sem = new Map()
    for (const [al, a] of lista) {
      const s = m.semestre.get(al) ?? 0
      const g = sem.get(s) || { alunos: 0, concluiram: 0, soma: 0, n: 0 }
      g.alunos++
      if (tudo(a)) g.concluiram++
      const md = mediaAluno(al)
      if (md != null) { g.soma += md; g.n++ }
      sem.set(s, g)
    }
    const semestres = [...sem.entries()].sort((a, b) => a[0] - b[0]).map(([s, g]) => ({ semestre: s || null, alunos: g.alunos, concluiram: g.concluiram, media: r2(g.n ? g.soma / g.n : null) }))

    // Por curso (curso mais frequente do aluno nas linhas do Docente)
    let cursos = []
    if (m.cursoVotos.size) {
      const porCurso = new Map()
      for (const [al, votos] of m.cursoVotos) {
        const cid = [...votos.entries()].sort((a, b) => b[1] - a[1])[0][0]
        const g = porCurso.get(cid) || { alunos: 0, concluiram: 0, pesq: new Map(), soma: 0, n: 0 }
        g.alunos++
        const a = lista.get(al)
        if (a && tudo(a)) g.concluiram++
        const pa = m.notas.get(al)
        if (pa) for (const [p, [s, n]] of pa) {
          const x = g.pesq.get(p) || [0, 0]
          x[0] += s
          x[1] += n
          g.pesq.set(p, x)
          g.soma += s
          g.n += n
        }
        porCurso.set(cid, g)
      }
      cursos = [...porCurso.entries()].map(([cid, g]) => ({
        curso_id: cid, alunos: g.alunos, concluiram: g.concluiram, media: r2(g.n ? g.soma / g.n : null),
        medias: Object.fromEntries([...g.pesq.entries()].map(([p, [s, n]]) => [p, r2(s / n)])),
      })).sort((a, b) => b.alunos - a.alunos)
    }

    // Quando respondem e quanto tempo levam
    const porDia = {}, horas = Array(24).fill(0), semana = Array(7).fill(0)
    const tempos = {}, abandono = {}
    for (const c of m.conclusao.values()) {
      if (c.fim) {
        porDia[c.fim.dia] = (porDia[c.fim.dia] || 0) + 1
        horas[c.fim.hora]++
        semana[c.fim.semana]++
        if (c.ini) {
          const d = c.fim.min - c.ini.min
          if (d >= 0 && d < 24 * 60) (tempos[c.pesq] ||= []).push(d)
        }
      } else {
        abandono[c.pesq] = (abandono[c.pesq] || 0) + 1
      }
    }
    const dias = Object.keys(porDia).sort()

    // Turmas de entrada
    const ent = new Map()
    for (const [al] of lista) {
      const e = m.entrada.get(al)
      if (e) ent.set(e, (ent.get(e) || 0) + 1)
    }

    const concluiramTudo = [...lista.values()].filter(tudo).length
    out[mod] = {
      alunos: lista.size,
      concluiram_tudo: concluiramTudo,
      questionarios: N,
      funil,
      semestres,
      cursos,
      por_dia: dias.map((d) => ({ dia: d, n: porDia[d] })),
      horas,
      semana,
      tempo_mediano: Object.fromEntries(Object.entries(tempos).map(([p, xs]) => [p, Math.round(mediana(xs) * 10) / 10])),
      abandono,
      comentarios: Object.fromEntries(m.comentarios),
      entradas: [...ent.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([codigo, alunos]) => ({ codigo, alunos })),
      periodo: dias.length ? { inicio: dias[0], fim: dias[dias.length - 1] } : null,
    }
  }
  return out
}
