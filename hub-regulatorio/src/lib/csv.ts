// Exportação para CSV que abre direto no Excel em português (separador ";" e acentos corretos).

export interface ColunaCsv<T> {
  titulo: string
  valor: (linha: T) => unknown
}

function celula(v: unknown): string {
  let s = v === null || v === undefined ? '' : v instanceof Date ? v.toLocaleDateString('pt-BR') : String(v)
  // Proteção contra "fórmula injetada": célula que começa com = + - @ vira texto no Excel
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function gerarCsv<T>(colunas: ColunaCsv<T>[], linhas: T[]): string {
  const cab = colunas.map((c) => celula(c.titulo)).join(';')
  const corpo = linhas.map((l) => colunas.map((c) => celula(c.valor(l))).join(';'))
  return [cab, ...corpo].join('\r\n')
}

export function baixarCsv<T>(nomeArquivo: string, colunas: ColunaCsv<T>[], linhas: T[]) {
  const conteudo = '﻿' + gerarCsv(colunas, linhas) // BOM: Excel reconhece os acentos
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Data de hoje no formato 2026-10-29, para compor nomes de arquivo. */
export const hojeArquivo = () => new Date().toISOString().slice(0, 10)
