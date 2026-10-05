// "Como vai ficar": o questionário montado como o aluno de cada modalidade vai ver (enunciado, perguntas,
// critério avaliativo e o espaço de comentário), com eixo e dimensão de cada pergunta e o gabarito SINAES ao lado.
// A Pró-Reitoria aprova, edita ou exclui cada pergunta aqui mesmo.
import { useState } from 'react'
import { MODALIDADES, MOD_CURTO, adaptadaDe, entra, prefixoDe, situacao, textoNaModalidade } from '../lib/proxima.js'
import { SelosEixoDim } from './ProximaSelos.jsx'

const ordem = (a, b) => (a.tipo === 'aberta') - (b.tipo === 'aberta') || (a.posicao ?? 999) - (b.posicao ?? 999)

export default function ProximaPublicada({ ctx, Gabarito, Resposta }) {
  const { dados, modo, salvarIt } = ctx
  const { itens, questionarios } = dados
  const pr = modo === 'pr'
  const [q, setQ] = useState(questionarios[0]?.id || '')
  const modsDe = (qid) => MODALIDADES.filter((m) => itens.some((i) => i.questionario_id === qid && i.incluida && i.modalidades.includes(m)))
  const [mod, setMod] = useState(() => modsDe(questionarios[0]?.id)[0] || MODALIDADES[0])
  const [soMudou, setSoMudou] = useState(false)
  const [lote, setLote] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  const escolherQ = (id) => {
    setQ(id)
    const ms = modsDe(id)
    if (!ms.includes(mod)) setMod(ms[0] || MODALIDADES[0])
  }
  const nome = questionarios.find((x) => x.id === q)?.nome
  // Mostra também as excluídas pela Pró-Reitoria (riscadas), para poder desfazer
  const lista = itens
    .filter((i) => i.questionario_id === q && i.incluida && i.modalidades.includes(mod))
    .filter((i) => !soMudou || situacao(i).t !== 'Mantida' || i.decisao_pr)
    .sort(ordem)
  const pref = prefixoDe(dados.prefixos, q, mod)
  const incluidas = itens.filter((i) => i.incluida)
  const decididas = incluidas.filter((i) => i.decisao_pr).length
  const pendentesAqui = lista.filter((i) => !i.decisao_pr)
  const contagem = (id) => itens.filter((i) => i.questionario_id === id && entra(i)).length

  const aprovarTodas = async () => {
    setOcupado(true)
    for (const it of pendentesAqui) await salvarIt(it, { decisao_pr: 'aprovada' }, 'aprovou a pergunta', { texto: it.texto })
    setOcupado(false)
    setLote(false)
  }

  let n = 0
  return (
    <>
      <div className="chips" role="tablist" aria-label="Questionários">
        {questionarios.map((x) => (
          <button key={x.id} role="tab" className="chip-btn" aria-selected={q === x.id} onClick={() => escolherQ(x.id)}>
            {x.nome}{x.origem === 'novo' ? ' (novo)' : ''} · {contagem(x.id)}
          </button>
        ))}
      </div>
      <div className="filtros">
        <div className="seg" role="group" aria-label="Modalidade">
          {MODALIDADES.map((m) => (
            <button key={m} aria-pressed={mod === m} disabled={!modsDe(q).includes(m)} onClick={() => setMod(m)}>{MOD_CURTO[m]}</button>
          ))}
        </div>
        <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={soMudou} onChange={(e) => setSoMudou(e.target.checked)} /> Mostrar só o que mudou
        </label>
        <span style={{ flex: 1 }} />
        <span className={'selo ' + (decididas === incluidas.length ? 'verde' : 'laranja')}>{decididas} de {incluidas.length} perguntas decididas</span>
      </div>

      <section className="grid-lado">
        <div className="coluna">
          <article className="card px-pub">
            <div className="px-pub-cab">
              <span className="eyebrow">{MOD_CURTO[mod]} · como o aluno vai ver</span>
              <h2>{nome}</h2>
            </div>
            {pref && lista.some((i) => i.tipo !== 'aberta') && (
              <div className="px-pub-pref"><span className="mods">Enunciado</span>{pref}</div>
            )}
            {!lista.length && <p className="muted">{soMudou ? 'Nada mudou neste questionário para ' + MOD_CURTO[mod] + '.' : 'Este questionário não aparece para ' + MOD_CURTO[mod] + '.'}</p>}
            {lista.map((it) => (
              <PerguntaPublicada key={it.id} ctx={ctx} item={it} mod={mod} num={it.tipo === 'aberta' ? null : ++n} Resposta={Resposta} />
            ))}
            {pr && pendentesAqui.length > 0 && (
              <div className="filtros" style={{ gap: 8 }}>
                {!lote ? (
                  <button className="btn sm" onClick={() => setLote(true)}>Aprovar as {pendentesAqui.length} que ainda não foram decididas aqui</button>
                ) : (
                  <>
                    <span className="small">Aprovar {pendentesAqui.length} {pendentesAqui.length === 1 ? 'pergunta' : 'perguntas'} de “{nome}” ({MOD_CURTO[mod]}) como estão?</span>
                    <button className="btn sm escuro" disabled={ocupado} onClick={aprovarTodas}>{ocupado ? 'Aprovando…' : 'Confirmar'}</button>
                    <button className="btn sm" disabled={ocupado} onClick={() => setLote(false)}>Cancelar</button>
                  </>
                )}
              </div>
            )}
          </article>
        </div>
        <div className="coluna">
          <Gabarito itens={itens} />
        </div>
      </section>
    </>
  )
}

function PerguntaPublicada({ ctx, item, mod, num, Resposta }) {
  const { modo, salvarIt } = ctx
  const pr = modo === 'pr'
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(item.texto)
  const [excluir, setExcluir] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const s = situacao(item)
  const excluida = item.decisao_pr === 'reprovada'
  const fazer = async (patch, acao) => {
    setOcupado(true)
    await salvarIt(item, patch, acao, { texto: patch.texto || item.texto })
    setOcupado(false)
  }
  const mudou = s.t !== 'Mantida'

  return (
    <div className={'px-pub-q' + (excluida ? ' excluida' : item.decisao_pr === 'aprovada' ? ' aprovada' : '')}>
      <div className="px-pub-linha">
        {num != null ? <span className="px-pub-num">{num}</span> : <span className="px-pub-num aberta" aria-hidden="true">✎</span>}
        <div className="px-pub-corpo">
          {editando ? (
            <>
              <label className="sr-only" htmlFor={'pb-' + item.id}>Texto da pergunta</label>
              <textarea id={'pb-' + item.id} className="input" rows={2} style={{ height: 'auto', padding: 10, fontSize: 15 }} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
              <div className="filtros" style={{ gap: 6 }}>
                {pr && <button className="btn sm escuro" disabled={ocupado || !texto.trim()} onClick={async () => { await fazer({ texto: texto.trim(), editada_pr: true, decisao_pr: 'aprovada' }, 'editou e aprovou a pergunta'); setEditando(false) }}>Salvar e aprovar</button>}
                <button className="btn sm" disabled={ocupado || !texto.trim()} onClick={async () => { await fazer({ texto: texto.trim(), ...(pr ? { editada_pr: true } : {}) }, 'reescreveu a pergunta'); setEditando(false) }}>Só salvar</button>
                <button className="btn sm" onClick={() => { setTexto(item.texto); setEditando(false) }}>Cancelar</button>
                {item.texto_original && texto !== item.texto_original && <button className="btn sm" onClick={() => setTexto(item.texto_original)}>Voltar ao texto de hoje</button>}
              </div>
            </>
          ) : (
            <p className="px-pub-t">{textoNaModalidade(item, mod)}</p>
          )}
          {mudou && !editando && s.t === 'Reescrita' && <span className="small muted">Antes: “{item.texto_original}”</span>}
          {adaptadaDe(item) && !editando && <span className="small muted">{adaptadaDe(item)}</span>}
          <div className="px-selos">
            {item.tipo !== 'aberta' && <SelosEixoDim eixo={item.eixo} dimensao={item.dimensao} />}
            {item.tipo === 'aberta' && <span className="selo cinza">pergunta aberta</span>}
            {mudou && !excluida && <span className={'selo ' + s.c}>{s.t}</span>}
            {item.editada_pr && <span className="selo azul">editada pela Pró-Reitoria</span>}
            {item.decisao_pr === 'aprovada' && <span className="selo verde">aprovada</span>}
            {excluida && <span className="selo laranja">excluída pela Pró-Reitoria</span>}
          </div>
          {item.tipo === 'aberta' ? (
            <div className="px-pub-coment" aria-hidden="true">Espaço para o aluno escrever</div>
          ) : (
            <div className="px-pub-alt">
              <span className="small" style={{ fontWeight: 700 }}>Critério avaliativo</span>
              <Resposta item={item} mod={mod} />
            </div>
          )}
        </div>
      </div>
      {pr && !editando && (
        <div className="filtros px-pub-acoes">
          {excluida ? (
            <button className="btn sm" disabled={ocupado} onClick={() => fazer({ decisao_pr: null }, 'desfez a exclusão da pergunta')}>Desfazer a exclusão</button>
          ) : (
            <>
              <button className={'btn sm' + (item.decisao_pr === 'aprovada' ? ' escuro' : '')} disabled={ocupado} onClick={() => fazer({ decisao_pr: item.decisao_pr === 'aprovada' ? null : 'aprovada' }, item.decisao_pr === 'aprovada' ? 'desfez a aprovação' : 'aprovou a pergunta')}>
                {item.decisao_pr === 'aprovada' ? '✓ Aprovada' : 'Aprovar'}
              </button>
              <button className="btn sm" onClick={() => { setTexto(item.texto); setEditando(true) }}>Editar</button>
              {!excluir ? (
                <button className="btn sm" onClick={() => setExcluir(true)}>Excluir</button>
              ) : (
                <span className="px-confirma">
                  <span className="small">Tirar esta pergunta do questionário?</span>
                  <button className="btn sm escuro" disabled={ocupado} onClick={async () => { await fazer({ decisao_pr: 'reprovada' }, 'excluiu a pergunta'); setExcluir(false) }}>Sim, excluir</button>
                  <button className="btn sm" onClick={() => setExcluir(false)}>Não</button>
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
