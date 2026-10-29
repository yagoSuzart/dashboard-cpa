// =====================================================================
//  GOOGLE DRIVE — login no navegador (Google Identity Services) + Drive API v3.
//  Não há servidor: o token fica só na memória desta aba e some ao fechar/recarregar.
//  Configuração: CONFIG.google.clientId (src/config.ts).
// =====================================================================
import { CONFIG } from '../config'

export const driveConfigurado = () => CONFIG.google.clientId.trim().length > 0

export interface ArquivoDrive {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  size?: string
  webViewLink?: string
  owners?: { displayName?: string }[]
}

export const PASTA = 'application/vnd.google-apps.folder'

export class ErroDrive extends Error {
  constructor(mensagem: string, readonly tipo: 'sessao' | 'permissao' | 'rede' | 'outro' = 'outro') {
    super(mensagem)
    this.name = 'ErroDrive'
  }
}

// ---------------------------------------------------------------------
//  Login (token de acesso)
// ---------------------------------------------------------------------
interface TokenClient {
  requestAccessToken: (o?: { prompt?: string }) => void
}
interface RespostaToken {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (o: {
            client_id: string
            scope: string
            callback: (r: RespostaToken) => void
            error_callback?: (e: { type?: string; message?: string }) => void
          }) => TokenClient
          revoke: (token: string, cb?: () => void) => void
        }
      }
    }
  }
}

let token: { valor: string; expira: number } | null = null
let gis: Promise<void> | null = null

function carregarGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  gis ??= new Promise<void>((ok, falha) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => ok()
    s.onerror = () => {
      gis = null
      falha(new ErroDrive('Não foi possível carregar o login do Google (verifique a internet ou bloqueadores).', 'rede'))
    }
    document.head.append(s)
  })
  return gis
}

export const conectado = () => !!token && token.expira > Date.now()

/** Abre a janela do Google para a pessoa autorizar o acesso ao Drive dela. */
export async function entrar(): Promise<void> {
  if (!driveConfigurado()) throw new ErroDrive('Client ID do Google não configurado.')
  await carregarGis()
  await new Promise<void>((ok, falha) => {
    const cliente = window.google!.accounts.oauth2.initTokenClient({
      client_id: CONFIG.google.clientId,
      scope: CONFIG.google.escopo,
      callback: (r) => {
        if (r.error || !r.access_token) return falha(new ErroDrive(r.error_description || 'Acesso não autorizado.', 'permissao'))
        token = { valor: r.access_token, expira: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 }
        ok()
      },
      error_callback: (e) =>
        falha(new ErroDrive(e.type === 'popup_closed' ? 'A janela do Google foi fechada antes de concluir.' : e.message || 'Falha no login do Google.', 'permissao')),
    })
    cliente.requestAccessToken({ prompt: '' })
  })
}

export function sair() {
  if (token && window.google) window.google.accounts.oauth2.revoke(token.valor)
  token = null
}

// ---------------------------------------------------------------------
//  Chamadas à Drive API
// ---------------------------------------------------------------------
const API = 'https://www.googleapis.com/drive/v3'
const CAMPOS = 'id,name,mimeType,modifiedTime,size,webViewLink,owners(displayName)'

function cabecalhoAuth(): Record<string, string> {
  if (!conectado()) throw new ErroDrive('Sua sessão do Google expirou. Entre de novo.', 'sessao')
  return { Authorization: `Bearer ${token!.valor}` }
}

async function chamar<T>(caminho: string, params: Record<string, string>): Promise<T> {
  let r: Response
  try {
    r = await fetch(`${API}${caminho}?${new URLSearchParams(params)}`, { headers: cabecalhoAuth() })
  } catch {
    throw new ErroDrive('Sem conexão com o Google Drive.', 'rede')
  }
  if (r.status === 401) {
    token = null
    throw new ErroDrive('Sua sessão do Google expirou. Entre de novo.', 'sessao')
  }
  if (r.status === 403 || r.status === 404) {
    throw new ErroDrive('Você não tem acesso a esta pasta no Drive (ou ela não existe mais). Peça acesso a quem administra a pasta.', 'permissao')
  }
  if (!r.ok) throw new ErroDrive(`O Google Drive respondeu com erro ${r.status}.`)
  return r.json() as Promise<T>
}

/** Texto seguro dentro de uma consulta do Drive ('...'). */
const textoConsulta = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

async function listar(q: string, limite = 1000): Promise<ArquivoDrive[]> {
  const out: ArquivoDrive[] = []
  let pageToken = ''
  do {
    const r = await chamar<{ files: ArquivoDrive[]; nextPageToken?: string }>('/files', {
      q,
      fields: `nextPageToken,files(${CAMPOS})`,
      orderBy: 'folder,name_natural',
      pageSize: '200',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    })
    out.push(...r.files)
    pageToken = r.nextPageToken ?? ''
  } while (pageToken && out.length < limite)
  return out
}

/** Conteúdo de uma pasta (pastas primeiro, depois arquivos, em ordem alfabética). */
export function listarPasta(pastaId: string): Promise<ArquivoDrive[]> {
  return listar(`'${textoConsulta(pastaId)}' in parents and trashed = false`)
}

/** Busca por nome em tudo o que a pessoa pode ver no Drive. */
export function buscarNoDrive(termo: string): Promise<ArquivoDrive[]> {
  return listar(`name contains '${textoConsulta(termo)}' and trashed = false`, 200)
}

// ---------------------------------------------------------------------
//  Envio de arquivo (upload) com barra de progresso
// ---------------------------------------------------------------------
const LIMITE_MULTIPART = 5 * 1024 * 1024 // até 5 MB: envio em uma requisição só

function enviarXhr(metodo: string, url: string, cabecalhos: Record<string, string>, corpo: Blob | FormData, progresso: (p: number) => void): Promise<XMLHttpRequest> {
  return new Promise((ok, falha) => {
    const x = new XMLHttpRequest()
    x.open(metodo, url)
    Object.entries(cabecalhos).forEach(([k, v]) => x.setRequestHeader(k, v))
    x.upload.onprogress = (e) => e.lengthComputable && progresso(e.loaded / e.total)
    x.onload = () => (x.status >= 200 && x.status < 300 ? ok(x) : falha(new ErroDrive(x.status === 403 ? 'Sem permissão para enviar arquivos nesta pasta.' : `Falha no envio (erro ${x.status}).`, x.status === 403 ? 'permissao' : 'outro')))
    x.onerror = () => falha(new ErroDrive('Conexão interrompida durante o envio.', 'rede'))
    x.send(corpo)
  })
}

export async function enviarArquivo(arquivo: File, pastaId: string, progresso: (p: number) => void): Promise<ArquivoDrive> {
  const metadados = { name: arquivo.name, parents: [pastaId] }
  const base = 'https://www.googleapis.com/upload/drive/v3/files'
  const auth = cabecalhoAuth()
  const params = `supportsAllDrives=true&fields=${encodeURIComponent(CAMPOS)}`

  if (arquivo.size <= LIMITE_MULTIPART) {
    const corpo = new FormData()
    corpo.append('metadata', new Blob([JSON.stringify(metadados)], { type: 'application/json' }))
    corpo.append('file', arquivo)
    const x = await enviarXhr('POST', `${base}?uploadType=multipart&${params}`, auth, corpo, progresso)
    return JSON.parse(x.responseText)
  }

  // Arquivos grandes: envio "retomável" (abre a sessão e depois manda o conteúdo)
  const inicio = await fetch(`${base}?uploadType=resumable&${params}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': arquivo.type || 'application/octet-stream' },
    body: JSON.stringify(metadados),
  })
  const sessao = inicio.headers.get('Location')
  if (!inicio.ok || !sessao) throw new ErroDrive(`Não foi possível iniciar o envio de “${arquivo.name}”.`)
  const x = await enviarXhr('PUT', sessao, {}, arquivo, progresso)
  return JSON.parse(x.responseText)
}

// ---------------------------------------------------------------------
//  Apresentação
// ---------------------------------------------------------------------
export function tipoArquivo(mime: string): { icone: string; rotulo: string } {
  if (mime === PASTA) return { icone: '📁', rotulo: 'Pasta' }
  if (mime === 'application/vnd.google-apps.document') return { icone: '📄', rotulo: 'Documento Google' }
  if (mime === 'application/vnd.google-apps.spreadsheet') return { icone: '📊', rotulo: 'Planilha Google' }
  if (mime === 'application/vnd.google-apps.presentation') return { icone: '📽️', rotulo: 'Apresentação Google' }
  if (mime === 'application/vnd.google-apps.form') return { icone: '🧾', rotulo: 'Formulário Google' }
  if (mime === 'application/vnd.google-apps.shortcut') return { icone: '🔗', rotulo: 'Atalho' }
  if (mime === 'application/pdf') return { icone: '📕', rotulo: 'PDF' }
  if (/word|opendocument\.text/.test(mime)) return { icone: '📝', rotulo: 'Word' }
  if (/sheet|excel|csv/.test(mime)) return { icone: '📗', rotulo: 'Planilha' }
  if (/presentation|powerpoint/.test(mime)) return { icone: '📙', rotulo: 'Apresentação' }
  if (mime.startsWith('image/')) return { icone: '🖼️', rotulo: 'Imagem' }
  if (mime.startsWith('video/')) return { icone: '🎬', rotulo: 'Vídeo' }
  if (mime.startsWith('audio/')) return { icone: '🎧', rotulo: 'Áudio' }
  if (/zip|rar|7z|compressed/.test(mime)) return { icone: '🗜️', rotulo: 'Compactado' }
  return { icone: '📎', rotulo: 'Arquivo' }
}

export function tamanho(bytes?: string): string {
  const n = Number(bytes)
  if (!bytes || !Number.isFinite(n)) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`
}

export const linkPastaNoDrive = (id: string) => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`
