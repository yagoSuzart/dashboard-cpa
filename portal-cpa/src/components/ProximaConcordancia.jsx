// "Ajustar o português": deixa o enunciado e as perguntas de um questionário encaixando na leitura
// (ex.: "Qual o seu grau de satisfação com relação" + "ao dinamismo das aulas"). Mostra cada pergunta
// como o aluno vai ler, com o artigo sugerido; a pessoa troca o artigo com um clique e aplica tudo de uma vez.
import { useState } from 'react'
import { MOD_CURTO, registrar, salvarPrefixo, textoNaModalidade } from '../lib/proxima.js'
import { ARTIGOS_DO_ESTILO, ENUNCIADOS_QUE_ENCAIXAM, artigoInicial, estiloDoPrefixo, inferirArtigo, leitura, naoEncaixa, textoNoEstilo } from '../lib/concordancia.js'

export default function ProximaConcordancia({ ctx, qid, nomeQ, mods, prefixoAtual, onFechar }) {
  const { perfil, dados, modo, setDados, setAviso, salvarIt } = ctx
  const estAtual = estiloDoPrefixo(prefixoAtual)
  const opcoes = [
    ...(['contracao', 'artigo', 'de'].includes(estAtual) ? [{ texto: prefixoAtual, estilo: estAtual, exemplo: 'enunciado de hoje' }] : []),
    ...ENUNCIADOS_QUE_ENCAIXAM.filter((o) => o.texto !== prefixoAtual),
  ]
  const [prefixo, setPrefixo] = useState(opcoes[0])
  const itens = dados.itens
    .filter((i) => i.questionario_id === qid && i.incluida && i.decisao_pr !== 'reprovada' && i.tipo !== 'aberta' && i.modalidades.some((m) => mods.includes(m)))
    .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
  const base = (it) => textoNaModalidade(it, it.modalidades.find((m) => mods.includes(m)))
  const artigoDe = (it) => artigoInicial(base(it))?.artigo || inferirArtigo(base(it))
  const [linhas, setLinhas] = useState(() => Object.fromEntries(itens.map((it) => [it.id, { marcada: true, artigo: artigoDe(it), texto: null }])))
  const [ocupado, setOcupado] = useState(false)

  const novoTexto = (it) => {
    const l = linhas[it.id]
    return l.texto ?? textoNoEstilo(base(it), prefixo.estilo, l.artigo)
  }
  const muda = (id, patch) => setLinhas((ls) => ({ ...ls, [id]: { ...ls[id], ...patch } }))
  const mudancas = itens.filter((it) => linhas[it.id].marcada && novoTexto(it).trim() && novoTexto(it).trim() !== it.texto)
  const trocaPrefixo = prefixo.texto !== prefixoAtual

  const aplicar = async () => {
    setOcupado(true)
    try {
      if (trocaPrefixo) {
        let lista = [...(dados.prefixos || [])]
        for (const m of mods) {
          const novo = await salvarPrefixo(dados.proposta.id, lista, qid, m, prefixo.texto, perfil.id)
          lista = [...lista.filter((r) => !(r.questionario_id === qid && r.modalidade === m)), novo]
        }
        setDados((d) => ({ ...d, prefixos: lista }))
        registrar(dados.proposta.id, perfil.id, 'alterou o prefixo', { texto: prefixo.texto, antes: prefixoAtual, questionario: nomeQ, modalidades: mods })
      }
      for (const it of mudancas) {
        await salvarIt(it, { texto: novoTexto(it).trim(), ...(modo === 'pr' ? { editada_pr: true } : {}) }, 'ajustou o português da pergunta', { texto: novoTexto(it).trim(), antes: it.texto })
      }
      setAviso({ tipo: 'ok', txt: `Português ajustado em “${nomeQ}”: ${trocaPrefixo ? 'enunciado trocado e ' : ''}${mudancas.length} ${mudancas.length === 1 ? 'pergunta' : 'perguntas'}.` })
      onFechar()
    } catch (e) {
      setAviso({ tipo: 'erro', txt: 'Não foi possível ajustar: ' + (e.message || e) })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="cc-t" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <h2 id="cc-t">Ajustar o português · {nomeQ}</h2>
        <p className="muted small">Cada pergunta é lida junto com o enunciado. Escolha o enunciado e confira a frase completa; se o artigo não combinar, troque com um clique. Vale para {mods.map((m) => MOD_CURTO[m]).join(', ')}.</p>
        <fieldset className="px-cc-ops">
          <legend className="small" style={{ fontWeight: 700 }}>Enunciado</legend>
          {opcoes.map((o) => (
            <label key={o.texto} className={'px-cc-op' + (prefixo.texto === o.texto ? ' on' : '')}>
              <input type="radio" name="cc-pref" checked={prefixo.texto === o.texto} onChange={() => { setPrefixo(o); setLinhas((ls) => Object.fromEntries(Object.entries(ls).map(([k, v]) => [k, { ...v, texto: null }]))) }} />
              <span><b>{o.texto}</b><br /><span className="small muted">{o.exemplo}</span></span>
            </label>
          ))}
          {estAtual === 'termina_em_a' && <p className="small muted">Hoje: “{prefixoAtual}”. Terminando em “a”, a pergunta precisaria começar sem artigo e a leitura fica truncada (“com relação a: Dinamismo das aulas”).</p>}
        </fieldset>
        <div className="px-cc-lista">
          {itens.map((it) => {
            const l = linhas[it.id]
            const nt = novoTexto(it)
            return (
              <div key={it.id} className={'px-cc' + (l.marcada ? ' on' : '')}>
                <label className="px-cc-cab">
                  <input type="checkbox" checked={l.marcada} onChange={(e) => muda(it.id, { marcada: e.target.checked })} />
                  <span className="small muted">Hoje: {it.texto}</span>
                </label>
                {l.marcada && (
                  <>
                    <div className="filtros" style={{ gap: 6 }}>
                      <div className="seg" role="group" aria-label="Artigo">
                        {ARTIGOS_DO_ESTILO(prefixo.estilo).map(([a, rot]) => (
                          <button key={a} type="button" aria-pressed={l.artigo === a && l.texto == null} onClick={() => muda(it.id, { artigo: a, texto: null })}>{rot}</button>
                        ))}
                      </div>
                      <label className="sr-only" htmlFor={'cc-' + it.id}>Texto da pergunta</label>
                      <input id={'cc-' + it.id} className="input" style={{ flex: '1 1 320px', height: 36, fontSize: 14 }} value={nt} onChange={(e) => muda(it.id, { texto: e.target.value })} />
                    </div>
                    <p className={'px-leitura' + (naoEncaixa(prefixo.texto, nt) ? ' px-cc-ruim' : '')}><span className="mods">Como o aluno lê</span>{leitura(prefixo.texto, nt)}</p>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="filtros">
          <button className="btn escuro" disabled={ocupado || (!trocaPrefixo && !mudancas.length)} onClick={aplicar}>
            {ocupado ? 'Aplicando…' : `Aplicar${trocaPrefixo ? ' o enunciado e' : ''} ${mudancas.length} ${mudancas.length === 1 ? 'pergunta' : 'perguntas'}`}
          </button>
          <button className="btn" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
