// "Envio de Feedback para os alunos": gera o carrossel de imagens (Instagram/WhatsApp) com os planos de ação
// aprovados/concluídos da própria pessoa num curso que ela coordena. Mesmas regras do sistema anterior:
// menu só para quem tem curso vinculado (perfil.cursos), cursos = os vinculados, até 3 planos por peça.
import { useEffect, useMemo, useState } from 'react'
import { sb } from '../lib/dados.js'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { PECA_MAX_ITENS, gerarPeca } from '../lib/peca.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'

export default function Feedback({ perfil, base }) {
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const cursos = (perfil.cursos || []).map((id) => porId[id]).filter(Boolean)
  const [cursoId, setCursoId] = useState(cursos[0]?.id || '')
  const [meus, setMeus] = useState(null)
  const [erro, setErro] = useState(null)
  const [marcados, setMarcados] = useState([])
  const [aviso, setAviso] = useState(null)
  const [telas, setTelas] = useState([])
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    let vivo = true
    sb.from('planos_acao')
      .select('id, tipo, curso_id, setor_id, titulo, descricao, status, criado_em')
      .eq('usuario_id', perfil.id)
      .order('criado_em', { ascending: true })
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) setErro(error)
        else setMeus(data || [])
      })
    return () => { vivo = false }
  }, [perfil.id])

  const disponiveis = (meus || []).filter((it) => it.curso_id === cursoId && (it.status === 'aprovado' || it.status === 'concluido'))
  const curso = porId[cursoId]
  const rotulo = curso ? `${curso.nome} - ${MODALIDADE_LABEL[curso.modalidade] || curso.modalidade}` : ''

  function trocarCurso(id) {
    setCursoId(id)
    setMarcados([])
    setTelas([])
    setAviso(null)
  }

  function alternar(id) {
    if (marcados.includes(id)) return setMarcados(marcados.filter((x) => x !== id))
    if (marcados.length >= PECA_MAX_ITENS) return setAviso({ tipo: '', texto: 'Você pode escolher até 3 planos por peça.' })
    setAviso(null)
    setMarcados([...marcados, id])
  }

  async function gerar() {
    if (!curso) return setAviso({ tipo: '', texto: 'Selecione um curso.' })
    if (!marcados.length) return setAviso({ tipo: '', texto: 'Selecione pelo menos 1 plano de ação pra gerar a peça.' })
    const itens = marcados
      .map((id) => disponiveis.find((it) => it.id === id))
      .filter(Boolean)
      .map((it) => ({ problema: it.titulo || rotulo, solucao: it.descricao || '' }))
    setGerando(true)
    setTelas([])
    setAviso({ tipo: '', texto: 'Gerando peça, só um instante...' })
    try {
      const geradas = await gerarPeca({ curso: curso.nome, coordenador: perfil.nome, itens })
      setTelas(geradas.map((t) => ({ nome: t.nome, url: t.canvas.toDataURL('image/png') })))
      setAviso({ tipo: 'ok', texto: 'Peça gerada! Baixe cada tela abaixo (' + geradas.length + ' no total).' })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível gerar a peça.' })
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Feedback para os alunos</div>
          <h1>Envio de Feedback para os alunos</h1>
          <p className="muted" style={{ margin: 0 }}>
            Gera um carrossel de imagens (formato Instagram/WhatsApp) mostrando o que a CPA identificou e o que o seu plano de ação está fazendo sobre isso — pra postar no story/feed ou mandar no grupo da turma.
          </p>
        </div>
      </div>

      <div className="card">
        {!cursos.length ? (
          <Vazio>Você ainda não tem curso vinculado.</Vazio>
        ) : (
          <>
            <div className="campo">
              <label htmlFor="peca-curso">Curso</label>
              <select id="peca-curso" value={cursoId} onChange={(e) => trocarCurso(e.target.value)}>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({MODALIDADE_LABEL[c.modalidade] || c.modalidade})</option>
                ))}
              </select>
            </div>

            <div className="card-h">
              <div className="t">
                <strong>Escolha até {PECA_MAX_ITENS} planos aprovados/concluídos pra virarem a peça</strong>
                <span className="small muted">{marcados.length} de {PECA_MAX_ITENS} selecionados</span>
              </div>
            </div>

            <Erro erro={erro} />
            {!meus && !erro ? (
              <Carregando texto="Carregando seus planos…" />
            ) : !disponiveis.length ? (
              <Vazio>Nenhum plano aprovado ou concluído neste curso ainda.</Vazio>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {disponiveis.map((it) => (
                  <label key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={marcados.includes(it.id)} onChange={() => alternar(it.id)} style={{ marginTop: 3 }} />
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block' }}>{it.titulo || rotulo}</strong>
                      <span className="small muted" style={{ overflowWrap: 'anywhere' }}>{it.descricao || ''}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div>
              <button type="button" className="btn escuro" onClick={gerar} disabled={gerando}>
                {gerando ? 'Gerando…' : 'Gerar peça'}
              </button>
            </div>
            {aviso && <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.texto}</div>}

            {telas.length > 0 && (
              <div className="filtros">
                <button type="button" className="btn escuro" onClick={() => compartilhar(telas, cursoId).catch(() => {})}>Enviar no WhatsApp</button>
                <button type="button" className="btn" onClick={() => telas.forEach((t, i) => setTimeout(() => baixarUrl(t.url, 'CPA_' + cursoId + '_' + t.nome + '.png'), i * 400))}>Baixar todas as telas</button>
                <span className="small muted">No celular, "Enviar no WhatsApp" abre o compartilhamento com as {telas.length} telas juntas. No computador, as telas são baixadas para você anexar.</span>
              </div>
            )}
            {telas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {telas.map((t, i) => (
                  <div key={t.nome} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 180, maxWidth: '100%' }}>
                    <img src={t.url} alt={'Tela ' + (i + 1) + ' de ' + telas.length} style={{ width: '100%', aspectRatio: '1080 / 1350', borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }} />
                    <a className="btn sm" href={t.url} download={'CPA_' + cursoId + '_' + t.nome + '.png'} style={{ justifyContent: 'center', textDecoration: 'none' }}>
                      Baixar tela {i + 1}/{telas.length}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function baixarUrl(url, nome) {
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Compartilha as telas pelo menu do celular (WhatsApp, Instagram...). Onde não dá, baixa as imagens.
async function compartilhar(telas, cursoId) {
  const arquivos = await Promise.all(
    telas.map(async (t) => new File([await (await fetch(t.url)).blob()], 'CPA_' + cursoId + '_' + t.nome + '.png', { type: 'image/png' })),
  )
  if (navigator.canShare?.({ files: arquivos })) {
    await navigator.share({ files: arquivos, title: 'Resultado da CPA', text: 'O que fizemos com a sua resposta na CPA' })
    return
  }
  telas.forEach((t, i) => setTimeout(() => baixarUrl(t.url, arquivos[i].name), i * 400))
}
