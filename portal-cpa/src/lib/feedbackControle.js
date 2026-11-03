// Controle do feedback aos alunos (tabela feedback_eventos): o que cada pessoa já gerou / compartilhou.
import { sb } from './dados.js'

// Registra um evento sem atrapalhar quem está usando: se falhar, só avisa no console.
export function registrarFeedback(perfil, { curso_id, turma = null, formato, evento, itens = null }) {
  if (!perfil?.id || !curso_id) return
  sb.from('feedback_eventos')
    .insert({ usuario_id: perfil.id, curso_id, turma: turma || null, formato, evento, itens })
    .then(({ error }) => error && console.warn('Controle do feedback: não registrou o evento.', error.message))
}

export async function carregarEventosFeedback() {
  const out = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from('feedback_eventos').select('usuario_id, curso_id, turma, formato, evento, criado_em').order('criado_em').range(de, de + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}
