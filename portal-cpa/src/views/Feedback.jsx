// Feedback para os alunos: monta, a partir dos planos aprovados/concluídos da própria pessoa e das devolutivas "não
// há pontos a melhorar" aprovadas, o retorno da CPA para as turmas — sempre um por curso + modalidade (opcionalmente
// por turma). Dois formatos:
//   - Carrossel completo (capa, uma tela por item, encerramento) — até PECA_MAX_ITENS itens por carrossel;
//   - Card-resumo: 1 imagem com as ações e um QR code / link para a página pública "Retorno da CPA" daquele curso
//     (para quem tem muitos cursos e não quer encher os grupos de imagens).
// "Montar todos de uma vez" gera todos os cursos e modalidades com itens aprovados e baixa um ZIP.
import { useEffect, useMemo, useState } from 'react'
import { zipSync, strToU8 } from 'fflate'
import { sb, carregarTurmas } from '../lib/dados.js'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { PECA_MAX_ITENS, gerarCard, gerarPeca } from '../lib/peca.js'
import { Carregando, Erro, Vazio } from '../components/ui.jsx'
import './planos.css'

const TODAS = '*'

export default function Feedback({ perfil, base }) {
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const cursos = (perfil.cursos || []).map((id) => porId[id]).filter(Boolean)
  const [cursoId, setCursoId] = useState(cursos[0]?.id || '')
  const [meus, setMeus] = useState(null)
  const [erro, setErro] = useState(null)
  const [marcados, setMarcados] = useState([])
  const [aviso, setAviso] = useState(null)
  const [resultado, setResultado] = useState(null) // { link, arquivos: [File], urls: [string] } ou { zip: true }
  const [gerando, setGerando] = useState(false)
  const [turmas, setTurmas] = useState({ curso: null, lista: [] })
  const [turma, setTurma] = useState('')
  const [formatoLote, setFormatoLote] = useState('card')
  const [lote, setLote] = useState(null) // { estado, feito, total, cursos: [{ c, mod, link, partes: [[File]] }] }

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

  // Turmas do curso escolhido (para o feedback por turma, opcional)
  useEffect(() => {
    let vivo = true
    if (!cursoId) return
    carregarTurmas(cursoId)
      .then((t) => vivo && setTurmas({ curso: cursoId, lista: [...new Set((t || []).map((x) => x.turma).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })) }))
      .catch(() => vivo && setTurmas({ curso: cursoId, lista: [] }))
    return () => { vivo = false }
  }, [cursoId])
  const listaTurmas = turmas.curso === cursoId ? turmas.lista : []

  const aprovados = (id) => (meus || []).filter((it) => it.curso_id === id && (it.status === 'aprovado' || it.status === 'concluido'))
  const disponiveis = aprovados(cursoId)
  const comItens = cursos.filter((c) => aprovados(c.id).length)
  const curso = porId[cursoId]
  const modalidade = curso ? modal(curso) : ''
  const rotuloAtual = curso ? `${curso.nome} ${modalidade}${turma && turma !== TODAS ? ' · turma ' + turma : ''}` : 'o curso'

  function trocarCurso(id) {
    setCursoId(id)
    setMarcados([])
    setResultado(null)
    setAviso(null)
    setTurma('')
  }

  function alternar(id) {
    if (marcados.includes(id)) return setMarcados(marcados.filter((x) => x !== id))
    if (marcados.length >= PECA_MAX_ITENS) return setAviso({ tipo: '', texto: `Você pode escolher até ${PECA_MAX_ITENS} itens por feedback.` })
    setAviso(null)
    setMarcados([...marcados, id])
  }

  // Gera os arquivos de um curso (e turma) no formato pedido
  async function arquivosDe(c, itens, formato, t) {
    const mod = modal(c)
    const link = linkRetorno(c.id, t)
    if (formato === 'card') {
      const canvas = await gerarCard({ curso: c.nome, modalidade: mod, turma: t, itens, link })
      return { link, partes: [[new File([await paraBlob(canvas)], `CPA_Feedback_${limpar(c.nome)}_${limpar(mod)}${t ? '_turma_' + limpar(t) : ''}.png`, { type: 'image/png' })]] }
    }
    const partes = []
    for (let k = 0; k < itens.length; k += PECA_MAX_ITENS) {
      const geradas = await gerarPeca({ curso: c.nome, modalidade: mod, turma: t, coordenador: perfil.nome, itens: itens.slice(k, k + PECA_MAX_ITENS) })
      const prefixo = itens.length > PECA_MAX_ITENS ? `parte${k / PECA_MAX_ITENS + 1}_` : ''
      partes.push(await Promise.all(geradas.map(async (g, j) => new File([await paraBlob(g.canvas)], `${prefixo}${String(j + 1).padStart(2, '0')}_${g.nome}.png`, { type: 'image/png' }))))
    }
    return { link, partes }
  }

  async function montar(formato) {
    if (!curso) return setAviso({ tipo: '', texto: 'Selecione um curso.' })
    const escolhidos = marcados.length ? marcados.map((id) => disponiveis.find((it) => it.id === id)).filter(Boolean) : formato === 'card' ? disponiveis : []
    if (!escolhidos.length) return setAviso({ tipo: '', texto: formato === 'card' ? 'Este curso ainda não tem itens aprovados.' : 'Selecione pelo menos 1 item para montar o carrossel.' })
    const itens = escolhidos.map(paraItem)
    setGerando(true)
    setResultado(null)
    setAviso({ tipo: '', texto: 'Montando o feedback, só um instante…' })
    try {
      if (turma === TODAS) {
        // Uma pasta por turma no ZIP
        const arquivos = {}
        for (const t of listaTurmas) {
          const r = await arquivosDe(curso, itens, formato, t)
          for (const parte of r.partes) for (const f of parte) arquivos[`Turma_${limpar(t)}/${f.name}`] = [new Uint8Array(await f.arrayBuffer()), { level: 0 }]
          arquivos[`Turma_${limpar(t)}/link.txt`] = strToU8(r.link + '\n')
        }
        baixarZip(arquivos, `CPA_Feedback_${limpar(curso.nome)}_${limpar(modalidade)}_por_turma.zip`)
        setResultado({ zip: true })
        setAviso({ tipo: 'ok', texto: `Pronto! Baixamos um ZIP com uma pasta para cada uma das ${listaTurmas.length} turmas de ${curso.nome} ${modalidade}.` })
      } else {
        const r = await arquivosDe(curso, itens, formato, turma)
        const arquivos = r.partes.flat()
        setResultado({ link: r.link, arquivos, urls: arquivos.map((f) => URL.createObjectURL(f)) })
        setAviso({ tipo: 'ok', texto: `Feedback de ${rotuloAtual} pronto! ${arquivos.length === 1 ? 'É 1 imagem' : `São ${arquivos.length} imagens`}: envie só para ${turma ? 'essa turma' : `as turmas de ${curso.nome} ${modalidade}`}.` })
      }
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível montar o feedback.' })
    } finally {
      setGerando(false)
    }
  }

  async function montarTodos() {
    if (!comItens.length) return
    const feitos = []
    setLote({ estado: 'gerando', feito: 0, total: comItens.length, cursos: [] })
    try {
      for (const [i, c] of comItens.entries()) {
        const r = await arquivosDe(c, aprovados(c.id).map(paraItem), formatoLote, '')
        feitos.push({ c, mod: modal(c), ...r })
        setLote({ estado: 'gerando', feito: i + 1, total: comItens.length, cursos: [...feitos] })
      }
      const arquivos = {}
      const links = []
      for (const r of feitos) {
        const pasta = formatoLote === 'card' ? '' : 'CPA_Feedback_' + limpar(r.c.nome) + '_' + limpar(r.mod) + '/'
        for (const parte of r.partes) for (const f of parte) arquivos[pasta + f.name] = [new Uint8Array(await f.arrayBuffer()), { level: 0 }]
        links.push(`${r.c.nome} ${r.mod}: ${r.link}`)
      }
      arquivos['links_por_curso.txt'] = strToU8(links.join('\n') + '\n')
      baixarZip(arquivos, 'CPA_Feedback_todos_os_cursos.zip')
      setLote({ estado: 'pronto', feito: feitos.length, total: feitos.length, cursos: feitos })
    } catch (e) {
      setLote(null)
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível montar os feedbacks.' })
    }
  }

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Feedback para os alunos</div>
          <h1>Mostre aos alunos o que a resposta deles virou.</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monte o retorno da CPA com as ações do seu curso e os pontos fortes que a CPA confirmou, para mandar no grupo da turma ou postar.
          </p>
        </div>
      </div>

      <div className="card" style={{ gap: 16 }}>
        {!cursos.length ? (
          <Vazio>Você ainda não tem curso vinculado.</Vazio>
        ) : (
          <>
            <div className="fb-regra" role="note">
              <b>Um feedback para cada curso e cada modalidade.</b>
              <span>
                Os alunos de cada modalidade avaliaram uma realidade diferente. Gere as imagens separadas — por exemplo,{' '}
                <b>Administração Presencial</b> e <b>Administração EAD</b> são dois feedbacks — e envie cada um só para as turmas daquela modalidade.
              </span>
            </div>

            {cursos.length > 1 && (
              <div className="fb-todos">
                <div>
                  <b>Tem muitos cursos? Monte todos de uma vez.</b>
                  <span className="small">
                    {meus ? `${comItens.length} de ${cursos.length} cursos/modalidades já têm itens aprovados. ` : ''}
                    Um clique gera o feedback de cada curso e modalidade e baixa um ZIP. Recomendado: <b>card-resumo</b>, 1 imagem por curso com um QR code que leva aos detalhes — sem encher o grupo de imagens.
                  </span>
                  <div className="seg" role="group" aria-label="Formato do lote" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                    <button aria-pressed={formatoLote === 'card'} onClick={() => setFormatoLote('card')}>Card-resumo (1 imagem + link)</button>
                    <button aria-pressed={formatoLote === 'carrossel'} onClick={() => setFormatoLote('carrossel')}>Carrossel completo</button>
                  </div>
                </div>
                <button type="button" className="btn escuro" onClick={montarTodos} disabled={!meus || !comItens.length || lote?.estado === 'gerando'}>
                  {lote?.estado === 'gerando' ? `Montando ${lote.feito} de ${lote.total}…` : `Montar todos (${comItens.length})`}
                </button>
              </div>
            )}
            {lote && (
              <div className="fb-lote" aria-live="polite">
                {lote.estado === 'pronto' && (
                  <div className="aviso ok">
                    Pronto! O ZIP “CPA_Feedback_todos_os_cursos” foi baixado{formatoLote === 'card' ? ' com um card por curso e modalidade e a lista de links' : ' com uma pasta por curso e modalidade'}. No celular, use os botões abaixo para mandar cada um no grupo da turma certa.
                  </div>
                )}
                {lote.cursos.map((r) => (
                  <div key={r.c.id} className="fb-lote-item">
                    <span><b>{r.c.nome}</b> · {r.mod}<span className="small muted"> · {r.partes.flat().length} {r.partes.flat().length === 1 ? 'imagem' : 'imagens'}{r.partes.length > 1 ? ` em ${r.partes.length} partes` : ''}</span></span>
                    <span className="fb-lote-btns">
                      {r.partes.map((parte, k) => (
                        <button key={k} type="button" className="btn sm" onClick={() => compartilhar(parte, textoEnvio(r.c, r.mod, '', r.link)).catch(() => {})}>
                          Enviar no WhatsApp{r.partes.length > 1 ? ` (parte ${k + 1})` : ''}
                        </button>
                      ))}
                      <BotaoCopiar texto={r.link} />
                    </span>
                  </div>
                ))}
                {lote.estado === 'pronto' && cursos.some((c) => !aprovados(c.id).length) && (
                  <p className="small muted" style={{ margin: 0 }}>
                    Ficaram de fora (nada aprovado ainda): {cursos.filter((c) => !aprovados(c.id).length).map((c) => `${c.nome} ${modal(c)}`).join(', ')}.
                  </p>
                )}
              </div>
            )}

            <div className="card-h">
              <div className="t">
                <strong>1. Escolha o curso e a modalidade</strong>
                <span className="small muted">Faça um feedback para cada um da lista.</span>
              </div>
            </div>
            <div className="fb-cursos" role="group" aria-label="Curso e modalidade">
              {cursos.map((c) => {
                const n = aprovados(c.id).length
                return (
                  <button key={c.id} type="button" className={'fb-curso' + (c.id === cursoId ? ' on' : '')} aria-pressed={c.id === cursoId} onClick={() => trocarCurso(c.id)}>
                    <b>{c.nome}</b>
                    <span className="fb-modal">{modal(c)}</span>
                    <span className="small muted">{meus ? (n ? `${n} ${n === 1 ? 'item aprovado' : 'itens aprovados'}` : 'nada aprovado ainda') : '…'}</span>
                  </button>
                )
              })}
            </div>

            {listaTurmas.length > 0 && (
              <div className="filtros">
                <label className="small" htmlFor="fb-turma" style={{ fontWeight: 700 }}>Turma (opcional)</label>
                <select id="fb-turma" className="input" style={{ height: 40, minWidth: 260 }} value={turma} onChange={(e) => { setTurma(e.target.value); setResultado(null); setAviso(null) }}>
                  <option value="">Curso inteiro (todas as turmas juntas)</option>
                  <option value={TODAS}>Todas as turmas — um feedback para cada (ZIP)</option>
                  {listaTurmas.map((t) => <option key={t} value={t}>Turma {t}</option>)}
                </select>
                <span className="small muted">Use só se pedirem um feedback da turma. O conteúdo é o do curso; a turma aparece na imagem.</span>
              </div>
            )}

            <div className="card-h">
              <div className="t">
                <strong>2. Escolha até {PECA_MAX_ITENS} itens aprovados de {curso ? `${curso.nome} ${modalidade}` : 'o curso'}</strong>
                <span className="small muted">No carrossel, cada plano vira uma tela “Ação” e cada “Não há pontos a melhorar” vira “Ponto forte”. O card-resumo usa todos os itens se nenhum for marcado.</span>
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
              <button type="button" className="btn escuro" onClick={() => montar('carrossel')} disabled={gerando}>
                {gerando ? 'Montando…' : `3. Montar carrossel de ${rotuloAtual}`}
              </button>
              <button type="button" className="btn" onClick={() => montar('card')} disabled={gerando || !disponiveis.length}>
                ou card-resumo (1 imagem + link)
              </button>
            </div>
            {aviso && <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.texto}</div>}

            {resultado && !resultado.zip && (
              <>
                <div className="filtros">
                  <button type="button" className="btn escuro" onClick={() => compartilhar(resultado.arquivos, textoEnvio(curso, modalidade, turma, resultado.link)).catch(() => {})}>4. Enviar no WhatsApp</button>
                  <button type="button" className="btn" onClick={() => resultado.arquivos.forEach((f, i) => setTimeout(() => baixarUrl(resultado.urls[i], f.name), i * 400))}>Baixar {resultado.arquivos.length === 1 ? 'a imagem' : 'todas as imagens'}</button>
                  <BotaoCopiar texto={resultado.link} rotulo="Copiar link da página do curso" />
                  <span className="small muted">No celular, “Enviar no WhatsApp” abre o compartilhamento com as imagens e o link. No computador, elas são baixadas.</span>
                </div>
                <div className="fb-telas">
                  {resultado.arquivos.map((f, i) => (
                    <figure key={f.name} className="fb-tela">
                      <img src={resultado.urls[i]} alt={'Imagem ' + (i + 1) + ' de ' + resultado.arquivos.length} />
                      <a className="btn sm" href={resultado.urls[i]} download={f.name}>Baixar {i + 1}/{resultado.arquivos.length}</a>
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

function BotaoCopiar({ texto, rotulo = 'Copiar link' }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className="btn sm" onClick={() => navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 2000) }).catch(() => {})}>
      {ok ? 'Link copiado ✓' : rotulo}
    </button>
  )
}

const modal = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''
const paraItem = (it) => ({
  tipo: it.sem_melhoria ? 'forte' : 'plano',
  questionario: (it.categoria || '').split(',')[0].trim(),
  titulo: it.titulo || '',
  descricao: it.descricao || '',
  prazo: it.prazo,
  status: it.status,
})
const paraBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
const limpar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')
// Página pública "Retorno da CPA" do curso (e turma), aberta pelo QR code do card-resumo
const linkRetorno = (cursoId, turma) => `${location.origin}${location.pathname}#/retorno/${encodeURIComponent(cursoId)}${turma ? '/' + encodeURIComponent(turma) : ''}`
const textoEnvio = (c, mod, turma, link) => `Resultado da CPA · ${c.nome} ${mod}${turma && turma !== TODAS ? ' · turma ' + turma : ''}: veja o que a sua resposta virou. Detalhes: ${link}`

function baixarZip(arquivos, nome) {
  baixarUrl(URL.createObjectURL(new Blob([zipSync(arquivos)], { type: 'application/zip' })), nome)
}

function baixarUrl(url, nome) {
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Compartilha pelo menu do celular (WhatsApp, Instagram...) com o texto e o link. Onde não dá, baixa as imagens.
async function compartilhar(arquivos, texto) {
  if (navigator.canShare?.({ files: arquivos })) {
    await navigator.share({ files: arquivos, title: 'Resultado da CPA', text: texto })
    return
  }
  arquivos.forEach((f, i) => setTimeout(() => baixarUrl(URL.createObjectURL(f), f.name), i * 400))
}
