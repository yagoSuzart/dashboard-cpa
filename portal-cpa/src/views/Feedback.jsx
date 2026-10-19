// Feedback para os alunos: monta o carrossel de imagens (Instagram/WhatsApp) com o que o curso está fazendo a partir
// da CPA — os planos aprovados/concluídos da própria pessoa num curso que ela coordena e as devolutivas "não há pontos
// a melhorar" aprovadas (viram tela de ponto forte). Até PECA_MAX_ITENS itens por feedback.
import { useEffect, useMemo, useState } from 'react'
import { sb } from '../lib/dados.js'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { PECA_MAX_ITENS, gerarPeca } from '../lib/peca.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'
import './planos.css'

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
      .select('id, tipo, curso_id, titulo, descricao, categoria, prazo, status, sem_melhoria, criado_em')
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
  const modalidade = curso ? MODALIDADE_LABEL[curso.modalidade] || curso.modalidade : ''

  function trocarCurso(id) {
    setCursoId(id)
    setMarcados([])
    setTelas([])
    setAviso(null)
  }

  function alternar(id) {
    if (marcados.includes(id)) return setMarcados(marcados.filter((x) => x !== id))
    if (marcados.length >= PECA_MAX_ITENS) return setAviso({ tipo: '', texto: `Você pode escolher até ${PECA_MAX_ITENS} itens por feedback.` })
    setAviso(null)
    setMarcados([...marcados, id])
  }

  async function montar() {
    if (!curso) return setAviso({ tipo: '', texto: 'Selecione um curso.' })
    if (!marcados.length) return setAviso({ tipo: '', texto: 'Selecione pelo menos 1 item para montar o feedback.' })
    const itens = marcados
      .map((id) => disponiveis.find((it) => it.id === id))
      .filter(Boolean)
      .map((it) => ({
        tipo: it.sem_melhoria ? 'forte' : 'plano',
        questionario: (it.categoria || '').split(',')[0].trim(),
        titulo: it.titulo || '',
        descricao: it.descricao || '',
        prazo: it.prazo,
        status: it.status,
      }))
    setGerando(true)
    setTelas([])
    setAviso({ tipo: '', texto: 'Montando o feedback, só um instante…' })
    try {
      const geradas = await gerarPeca({ curso: curso.nome, modalidade, coordenador: perfil.nome, itens })
      setTelas(geradas.map((t) => ({ nome: t.nome, url: t.canvas.toDataURL('image/png') })))
      setAviso({ tipo: 'ok', texto: `Feedback pronto! São ${geradas.length} imagens: envie todas juntas no WhatsApp ou baixe para postar.` })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível montar o feedback.' })
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Feedback para os alunos</div>
          <h1>Mostre aos alunos o que a resposta deles virou.</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monte um carrossel de imagens (Instagram/WhatsApp) com as ações do seu curso e os pontos fortes que a CPA confirmou, para postar ou mandar no grupo da turma.
          </p>
        </div>
      </div>

      <div className="card" style={{ gap: 16 }}>
        {!cursos.length ? (
          <Vazio>Você ainda não tem curso vinculado.</Vazio>
        ) : (
          <>
            <div className="campo" style={{ maxWidth: 520 }}>
              <label htmlFor="peca-curso">Curso</label>
              <select id="peca-curso" value={cursoId} onChange={(e) => trocarCurso(e.target.value)}>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({MODALIDADE_LABEL[c.modalidade] || c.modalidade})</option>
                ))}
              </select>
            </div>

            <div className="card-h">
              <div className="t">
                <strong>1. Escolha até {PECA_MAX_ITENS} itens aprovados</strong>
                <span className="small muted">Cada plano vira uma tela “Ação”; cada “Não há pontos a melhorar” vira uma tela “Ponto forte”.</span>
              </div>
              <div className="spacer" />
              <span className="selo cinza">{marcados.length} de {PECA_MAX_ITENS}</span>
            </div>

            <Erro erro={erro} />
            {!meus && !erro ? (
              <Carregando texto="Carregando seus planos…" />
            ) : !disponiveis.length ? (
              <Vazio>Nenhum plano aprovado ou concluído neste curso ainda. Assim que a CPA e a Pró-Reitoria aprovarem, ele aparece aqui.</Vazio>
            ) : (
              <div className="fb-itens">
                {disponiveis.map((it) => {
                  const on = marcados.includes(it.id)
                  return (
                    <button key={it.id} type="button" className={'fb-item' + (on ? ' on' : '') + (it.sem_melhoria ? ' forte' : '')} aria-pressed={on} onClick={() => alternar(it.id)}>
                      <span className="fb-check" aria-hidden="true">{on ? '✓' : ''}</span>
                      <span className="fb-txt">
                        <span className="fb-tipo">{it.sem_melhoria ? 'Ponto forte' : 'Ação'} · {(it.categoria || '').split(',')[0]}</span>
                        <b>{it.sem_melhoria ? 'Não há pontos a melhorar' : it.titulo}</b>
                        <span className="small muted fb-desc">{it.descricao || ''}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="filtros">
              <button type="button" className="btn escuro" onClick={montar} disabled={gerando}>
                {gerando ? 'Montando…' : '2. Montar feedback'}
              </button>
              {aviso && <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'} style={{ flex: 1 }}>{aviso.texto}</div>}
            </div>

            {telas.length > 0 && (
              <>
                <div className="filtros">
                  <button type="button" className="btn escuro" onClick={() => compartilhar(telas, cursoId).catch(() => {})}>3. Enviar no WhatsApp</button>
                  <button type="button" className="btn" onClick={() => telas.forEach((t, i) => setTimeout(() => baixarUrl(t.url, 'CPA_' + cursoId + '_' + t.nome + '.png'), i * 400))}>Baixar todas as imagens</button>
                  <span className="small muted">No celular, “Enviar no WhatsApp” abre o compartilhamento com as {telas.length} imagens juntas. No computador, elas são baixadas para você anexar.</span>
                </div>
                <div className="fb-telas">
                  {telas.map((t, i) => (
                    <figure key={t.nome} className="fb-tela">
                      <img src={t.url} alt={'Imagem ' + (i + 1) + ' de ' + telas.length} />
                      <a className="btn sm" href={t.url} download={'CPA_' + cursoId + '_' + t.nome + '.png'}>Baixar {i + 1}/{telas.length}</a>
                    </figure>
                  ))}
                </div>
              </>
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
