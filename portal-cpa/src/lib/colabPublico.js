// Página aberta: números ao vivo da CPA de Docentes e Administrativo, direto das respostas do Portal (sem planilha).
// Um único carregamento por página, compartilhado pelo topo e pela seção; atualiza a cada minuto e ao voltar para a aba.
import { useEffect, useState } from 'react'
import { SUPABASE } from './config.js'

const MINUTO = 60 * 1000

export async function carregarColabPublico() {
  const r = await fetch(`${SUPABASE.url}/rest/v1/rpc/colab_panorama_publico`, {
    method: 'POST',
    headers: { apikey: SUPABASE.chave, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

export function useColabAoVivo() {
  const [d, setD] = useState(undefined)
  useEffect(() => {
    let vivo = true
    const puxar = () => carregarColabPublico().then((x) => vivo && setD(x)).catch(() => vivo && setD((v) => v ?? null))
    puxar()
    const t = setInterval(puxar, MINUTO)
    const ver = () => document.visibilityState === 'visible' && puxar()
    document.addEventListener('visibilitychange', ver)
    return () => { vivo = false; clearInterval(t); document.removeEventListener('visibilitychange', ver) }
  }, [])
  return d
}

// Quantas avaliações chegaram hoje (horário de Brasília)
export function deHoje(d) {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  return (d?.por_dia || []).filter((x) => x.dia === hoje).reduce((s, x) => s + x.n, 0)
}

export const pctDe = (n, total) => (total > 0 ? Math.min(100, (n / total) * 100) : null)
export const fmtPctColab = (v) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%')
export const quando = (s) => new Date(s).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
