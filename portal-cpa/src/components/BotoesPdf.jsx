// Botões de PDF prontos para as telas (mesmos relatórios do sistema anterior; ver src/lib/pdf.js).
//
// <BotaoPdf tipo="curso" base={base} cursoId={id} />
// <BotaoPdf tipo="geral" base={base} escopo={escopo} />
// <BotaoPdf tipo="setor" base={base} setorId={perfil.setor} />
// <BotaoPdf tipo="planos" base={base} escopo={escopo} perfil={perfil} />
// <BotaoPdf tipo="meuPlano" base={base} perfil={perfil} />
//   props: tipo (obrigatório), rotulo (texto do botão; padrão = texto do antigo), className (padrão "btn sm"),
//          e os argumentos do relatório (base, perfil, escopo, cursoId, setorId, respondentes, comentarios).
//
// <BotoesPdf tipos={['curso', 'geral']} base={base} escopo={escopo} cursoId={id} />
//   Grupo de botões lado a lado, com um único aviso (sucesso/erro) embaixo. Recebe as mesmas props de dados.
import { useState } from 'react'

const ROTULOS = {
  curso: 'Baixar PDF deste curso',
  geral: 'PDF geral (todos os cursos)',
  setor: 'Baixar PDF deste setor',
  planos: 'Baixar PDF de todos os planos de ação (com comentários)',
  meuPlano: 'Baixar PDF do meu plano',
}

const FUNCOES = {
  curso: 'baixarPdfCurso',
  geral: 'baixarPdfGeral',
  setor: 'baixarPdfSetor',
  planos: 'baixarPdfPlanos',
  meuPlano: 'baixarPdfMeuPlano',
}

function useGerar() {
  const [ocupado, setOcupado] = useState('')
  const [aviso, setAviso] = useState(null)
  async function gerar(tipo, args) {
    if (ocupado) return
    setOcupado(tipo)
    setAviso({ tipo: '', texto: tipo === 'planos' ? 'Gerando PDF com todos os planos de ação... isso pode levar alguns segundos.' : 'Gerando PDF…' })
    try {
      const pdf = await import('../lib/pdf.js')
      const msg = await pdf[FUNCOES[tipo]](args)
      setAviso({ tipo: 'ok', texto: msg })
    } catch (e) {
      console.error('Erro ao gerar PDF:', e)
      setAviso({ tipo: 'erro', texto: e?.message || 'Não foi possível gerar o PDF agora.' })
    } finally {
      setOcupado('')
    }
  }
  return { ocupado, aviso, gerar }
}

function Aviso({ aviso }) {
  if (!aviso) return null
  return (
    <div className={'aviso' + (aviso.tipo ? ' ' + aviso.tipo : '')} role={aviso.tipo === 'erro' ? 'alert' : 'status'} style={{ fontSize: 13 }}>
      {aviso.texto}
    </div>
  )
}

export function BotaoPdf({ tipo, rotulo, className = 'btn sm', ...args }) {
  const { ocupado, aviso, gerar } = useGerar()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <button type="button" className={className} disabled={!!ocupado} onClick={() => gerar(tipo, args)} style={{ maxWidth: '100%', whiteSpace: 'normal', height: 'auto', minHeight: 36, paddingBlock: 6 }}>
        {ocupado ? 'Gerando…' : rotulo || ROTULOS[tipo]}
      </button>
      <Aviso aviso={aviso} />
    </div>
  )
}

export default function BotoesPdf({ tipos = [], rotulos = {}, className = 'btn sm', ...args }) {
  const { ocupado, aviso, gerar } = useGerar()
  if (!tipos.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tipos.map((t) => (
          <button key={t} type="button" className={className} disabled={!!ocupado} onClick={() => gerar(t, args)} style={{ maxWidth: '100%', whiteSpace: 'normal', height: 'auto', minHeight: 36, paddingBlock: 6 }}>
            {ocupado === t ? 'Gerando…' : rotulos[t] || ROTULOS[t]}
          </button>
        ))}
      </div>
      <Aviso aviso={aviso} />
    </div>
  )
}
