// "Não há pontos a melhorar": o coordenador sinaliza que, naquele curso + modalidade + questionário, não identificou
// pontos que exijam plano. Vem com um texto padrão carinhoso, em forma de devolutiva positiva para os alunos, que ele
// pode ajustar. Segue o mesmo envio de um plano e conta como entregue.
import { useState } from 'react'
import { MODALIDADE_LABEL, META } from '../lib/config.js'
import { fmtNota } from '../lib/cpa.js'
import { criarDeclaracaoSemMelhoria, statusDeEnvio, textoSemMelhoria } from '../lib/planos.js'

const modalidade = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''

export default function SemMelhoria({ d, curso, perfil, nota, onCancelar, onEnviado }) {
  const [texto, setTexto] = useState(() => textoSemMelhoria(d))
  const [confirmo, setConfirmo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const vaiPara = statusDeEnvio(perfil) === 'aguardando_coordenador' ? 'o coordenador do curso' : 'a análise da CPA'
  const abaixo = nota != null && nota < META

  async function enviar() {
    if (texto.trim().length < 40) return setErro('Escreva ao menos algumas linhas para os alunos.')
    if (!confirmo) return setErro('Marque a confirmação de que analisou a nota e os comentários.')
    setEnviando(true)
    setErro('')
    try {
      await criarDeclaracaoSemMelhoria(perfil, { curso_id: curso.id, categoria: d, texto: texto.trim() })
      onEnviado(`Pronto! A devolutiva de ${d} foi enviada para ${vaiPara} e este questionário passa a contar como entregue.`)
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar.')
      setEnviando(false)
    }
  }

  return (
    <div className="mp-sem">
      <b>Não há pontos a melhorar em {d}</b>
      <p className="small" style={{ margin: 0 }}>
        Use quando, depois de analisar a nota e os comentários de {curso.nome} ({modalidade(curso)}), você não identificar ponto que precise de
        um plano de melhoria. O texto abaixo é uma <b>devolutiva para os alunos</b>: já vem pronto, mas fique à vontade para personalizar.
      </p>
      {abaixo && (
        <div className="aviso" role="note">
          A nota deste questionário ({fmtNota(nota)}) está abaixo da meta ({fmtNota(META, 1)}). Tem certeza de que não há pontos a melhorar? Se houver
          algum, prefira montar um plano.
        </div>
      )}
      <label className="small" htmlFor={'sm-' + d} style={{ fontWeight: 700 }}>Mensagem para os alunos</label>
      <textarea id={'sm-' + d} rows={10} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} />
        Confirmo que analisei a nota e os comentários deste questionário e não identifiquei pontos que exijam um plano de melhoria.
      </label>
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <div className="mp-acoes">
        <button className="btn escuro" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar devolutiva'}</button>
        <button className="btn" onClick={onCancelar} disabled={enviando}>Cancelar</button>
      </div>
    </div>
  )
}
