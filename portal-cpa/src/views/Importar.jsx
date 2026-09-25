import { useEffect, useState } from 'react'
import { sb, ciclosImportados } from '../lib/dados.js'
import { lerPlanilha, gravarImportacao } from '../lib/importador.js'
import { fmtInt, nomeCurto } from '../lib/cpa.js'
import { Erro } from '../components/ui.jsx'

export default function Importar({ perfil, base }) {
  const [arquivo, setArquivo] = useState(null)
  const [ciclo, setCiclo] = useState('2026.1')
  const [fase, setFase] = useState('escolher') // escolher | lendo | conferir | gravando | pronto
  const [prog, setProg] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [historico, setHistorico] = useState([])
  const [gravado, setGravado] = useState(null)

  useEffect(() => {
    ciclosImportados().then(setHistorico).catch(() => {})
  }, [gravado])

  const ler = async () => {
    setErro(null)
    setFase('lendo')
    setProg(0)
    try {
      const r = await lerPlanilha(arquivo, {
        idsCursos: base.cursos.map((c) => c.id),
        onProgresso: ({ bytes, total }) => setProg(total ? bytes / total : 0),
      })
      setResultado(r)
      setFase('conferir')
    } catch (e) {
      setErro(e)
      setFase('escolher')
    }
  }

  const gravar = async () => {
    setErro(null)
    setFase('gravando')
    setProg(0)
    try {
      const g = await gravarImportacao(sb, {
        ciclo: ciclo.trim(),
        grupos: resultado.grupos,
        relatorio: resultado.relatorio,
        usuarioId: perfil.id,
        onProgresso: ({ gravados, total }) => setProg(gravados / total),
      })
      setGravado(g)
      setFase('pronto')
    } catch (e) {
      setErro(e)
      setFase('conferir')
    }
  }

  const rel = resultado?.relatorio
  const semCurso = rel ? Object.entries(rel.semCurso).sort((a, b) => b[1] - a[1]) : []

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Importar resultados da CPA</div>
          <h1>Planilha de respostas → nota de cada pergunta.</h1>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
            O arquivo é lido e somado aqui no seu computador. CPF, RA e identificação de alunos não saem do arquivo: só vão para o
            banco os totais por pergunta, curso, turma, disciplina e professor. Antes de gravar, você confere se todas as linhas bateram.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="filtros" style={{ alignItems: 'flex-end' }}>
          <div className="campo">
            <label htmlFor="imp-arq">Arquivo CSV da pesquisa (ex.: CPA.csv)</label>
            <input id="imp-arq" type="file" accept=".csv,text/csv" onChange={(e) => { setArquivo(e.target.files[0] || null); setResultado(null); setFase('escolher'); setGravado(null) }} style={{ height: 'auto', padding: 10, maxWidth: '100%' }} />
          </div>
          <div className="campo">
            <label htmlFor="imp-ciclo">Ciclo da pesquisa</label>
            <input id="imp-ciclo" value={ciclo} onChange={(e) => setCiclo(e.target.value)} style={{ width: 140 }} />
          </div>
          <button className="btn escuro" disabled={!arquivo || fase === 'lendo' || fase === 'gravando'} onClick={ler}>
            {fase === 'lendo' ? 'Lendo…' : 'Ler e conferir'}
          </button>
          {arquivo && <span className="small muted">{arquivo.name} · {(arquivo.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB</span>}
        </div>
        {(fase === 'lendo' || fase === 'gravando') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="progresso" role="progressbar" aria-valuenow={Math.round(prog * 100)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: prog * 100 + '%' }} /></div>
            <span className="small muted">{fase === 'lendo' ? 'Lendo a planilha' : 'Gravando no banco'} · {Math.round(prog * 100)}%</span>
          </div>
        )}
        <Erro erro={erro} />
      </div>

      {rel && rel.colunasFaltando.length > 0 && (
        <div className="aviso erro">
          Este arquivo não tem as colunas esperadas: {rel.colunasFaltando.join(', ')}. Confira se é a planilha de respostas da CPA.
        </div>
      )}

      {rel && !rel.colunasFaltando.length && (
        <>
          <div className="card">
            <div className="card-h">
              <div className="t">
                <h2>Conferência</h2>
                <p className="muted small">Cada linha da planilha precisa ter entrado como nota, como “6” (fora da média), como comentário ou como resposta inválida.</p>
              </div>
              <div className="spacer" />
              {rel.bate ? <span className="selo verde">Todas as linhas bateram</span> : <span className="selo laranja">Há linhas sem destino</span>}
            </div>
            <div className="grid5">
              <Kpi v={rel.linhasLidas} l="linhas lidas" />
              <Kpi v={rel.respostasNota} l="notas (entram na média)" />
              <Kpi v={rel.naoUtilizo} l="marcaram 6 (fora da média)" />
              <Kpi v={rel.respostasTexto} l="comentários (texto)" />
              <Kpi v={rel.invalidas} l="respostas inválidas" />
            </div>
            <div className="rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Questionário</th><th style={{ textAlign: 'right' }}>Linhas</th><th style={{ textAlign: 'right' }}>Notas</th>
                    <th style={{ textAlign: 'right' }}>6</th><th style={{ textAlign: 'right' }}>Comentários</th><th style={{ textAlign: 'right' }}>Inválidas</th><th>Confere?</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.conferencia.map((c) => (
                    <tr key={c.pesquisa}>
                      <td style={{ fontWeight: 600 }}>{nomeCurto(c.pesquisa) || '(linhas sem questionário)'}</td>
                      <td className="n">{fmtInt(c.linhas)}</td>
                      <td className="n">{fmtInt(c.nota)}</td>
                      <td className="n">{fmtInt(c.naoUtilizo)}</td>
                      <td className="n">{fmtInt(c.texto)}</td>
                      <td className="n">{fmtInt(c.invalidas)}</td>
                      <td>{c.linhas === c.somadas ? <span className="selo verde">sim</span> : <span className="selo laranja">não</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rel.exemplosInvalidas.length > 0 && (
              <p className="small muted">Exemplos de respostas inválidas: {rel.exemplosInvalidas.map((x) => `“${x.resposta}” (${nomeCurto(x.pesquisa)})`).join(', ')}</p>
            )}
            <p className="small muted">Períodos no arquivo: {Object.entries(rel.periodos).map(([p, n]) => `${p} (${fmtInt(n)})`).join(', ')}</p>
          </div>

          {semCurso.length > 0 && (
            <div className="card">
              <div className="card-h">
                <div className="t">
                  <h2>Cursos da planilha sem correspondência</h2>
                  <p className="muted small">As notas desses cursos entram na visão da instituição, mas não aparecem na página de nenhum curso. Envie esta lista para ajustarmos o nome.</p>
                </div>
              </div>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Ver os {semCurso.length} cursos</summary>
                <table className="tabela" style={{ marginTop: 10 }}>
                  <thead><tr><th>Curso · modalidade na planilha</th><th style={{ textAlign: 'right' }}>Notas</th></tr></thead>
                  <tbody>{semCurso.map(([k, n]) => <tr key={k}><td>{k}</td><td className="n">{fmtInt(n)}</td></tr>)}</tbody>
                </table>
              </details>
            </div>
          )}

          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <b>{fmtInt(rel.grupos)} grupos de resultado</b> prontos para gravar no ciclo <b>{ciclo}</b>.
              {historico.some((h) => h.ciclo === ciclo.trim()) && ' A importação anterior deste ciclo será substituída depois que a nova for gravada e conferida.'}
            </div>
            <button className="btn escuro" disabled={!rel.bate || !ciclo.trim() || fase === 'gravando' || fase === 'pronto'} onClick={gravar}>
              {fase === 'gravando' ? 'Gravando…' : 'Gravar no Portal'}
            </button>
          </div>
        </>
      )}

      {fase === 'pronto' && gravado && (
        <div className="aviso ok" role="status">
          Importação gravada e conferida: {fmtInt(gravado.gravado.grupos)} grupos e {fmtInt(gravado.gravado.n)} notas no banco, iguais ao arquivo.{' '}
          <a href="#/questionarios">Ver pergunta por pergunta</a>
        </div>
      )}

      {historico.length > 0 && (
        <div className="card">
          <div className="card-h"><div className="t"><h2>Importações anteriores</h2></div></div>
          <div className="rolagem"><table className="tabela">
            <thead><tr><th>Ciclo</th><th>Arquivo</th><th>Quando</th><th style={{ textAlign: 'right' }}>Linhas</th><th style={{ textAlign: 'right' }}>Notas</th></tr></thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.ciclo}</td>
                  <td>{h.arquivo}</td>
                  <td>{new Date(h.importado_em).toLocaleString('pt-BR')}</td>
                  <td className="n">{fmtInt(h.linhas_lidas)}</td>
                  <td className="n">{fmtInt(h.respostas_nota)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </>
  )
}

function Kpi({ v, l }) {
  return (
    <div className="kpi">
      <span className="v" style={{ fontSize: 32 }}>{fmtInt(v)}</span>
      <span className="l">{l}</span>
    </div>
  )
}
