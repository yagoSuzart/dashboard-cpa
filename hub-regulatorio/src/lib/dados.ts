// =====================================================================
//  CAMADA DE DADOS — o único arquivo que conversa com o Supabase.
//  As páginas nunca escrevem consultas: elas chamam getCursos(), getPolos() etc.
//  Tudo aqui é SÓ LEITURA (o banco só permite SELECT para o público).
// =====================================================================
import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config'
import { capitalizar, codigoPolo, conceito, data, modalidadeCurta, ufDe, type Conceito } from './normaliza'

const sb = createClient(CONFIG.supabase.url, CONFIG.supabase.chave, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------
//  Tipos: colunas reais das tabelas (nomes conferidos no schema)
// ---------------------------------------------------------------------
const COLUNAS_CURSO = [
  'id', 'codigo_emec', 'curso', 'habilitacao', 'modalidade', 'status', 'rotulo',
  'area_geral', 'area_especifica', 'area_detalhada',
  'inicio_funcionamento', 'data_inicio_funcionamento', 'tempo_duracao', 'vagas_anuais_autorizadas',
  'carga_horaria_total', 'carga_horaria_atividades_complementares', 'carga_horaria_estagio', 'semestres_estagio', 'possui_tcc',
  'cc', 'cpc', 'ultimo_conceito_enade',
  'portaria_autorizacao', 'abertura_processo_reconhecimento', 'situacao_processo_andamento', 'codigo_endereco_emec',
  'coordenador', 'coordenador_email', 'coordenador_telefone',
  'mercado_trabalho', 'conselho_classe', 'link_ppc', 'link_guia_curso', 'link_emec', 'link_portaria_pdf', 'updated_at',
] as const

export type CursoBanco = { id: string } & { [K in Exclude<(typeof COLUNAS_CURSO)[number], 'id'>]: string | null }

export interface Curso extends CursoBanco {
  ativo: boolean
  modalidadeCurta: string
  ccC: Conceito
  cpcC: Conceito
  enadeC: Conceito
  /** Data de abertura do processo de reconhecimento (texto dd/mm/aaaa convertido). */
  aberturaReconhecimento: Date | null
}

const COLUNAS_POLO = [
  'id', 'codigo_emec_polo', 'codigo_emec_polo_extracted', 'nome_polo', 'cidade', 'estado', 'regiao',
  'endereco', 'representante', 'nome_fantasia_parceiro', 'razao_social_parceiro', 'cnpj',
  'data_cadastro', 'ato_cadastro', 'situacao', 'cursos_ofertados', 'updated_at',
] as const

export type PoloBanco = { id: string } & { [K in Exclude<(typeof COLUNAS_POLO)[number], 'id'>]: string | null }

export interface Polo extends PoloBanco {
  ativo: boolean
  /** Sigla da UF padronizada ("EX" = exterior, null = não reconhecido). */
  uf: string | null
  codigo: string | null
  dataCadastro: Date | null
  situacaoTexto: string
}

export interface ResultadoAvaliacao {
  id: string
  curso_label: string | null
  area_concentracao: string | null
  conceito_autorizacao: number | null
  conceito_reconhecimento: number | null
  dim1_autorizacao: number | null
  dim1_reconhecimento: number | null
  dim2_autorizacao: number | null
  dim2_reconhecimento: number | null
  dim3_autorizacao: number | null
  dim3_reconhecimento: number | null
}

// ---------------------------------------------------------------------
//  Erros com mensagem em português
// ---------------------------------------------------------------------
export class ErroDados extends Error {
  constructor(mensagem: string, readonly original?: unknown) {
    super(mensagem)
    this.name = 'ErroDados'
  }
}

function traduzir(e: unknown): ErroDados {
  if (e instanceof ErroDados) return e
  const err = e as { message?: string; code?: string; status?: number }
  const msg = String(err?.message ?? e)
  if (!navigator.onLine || /failed to fetch|networkerror|load failed/i.test(msg)) {
    return new ErroDados('Sem conexão com o banco de dados. Verifique a internet e tente de novo.', e)
  }
  if (err?.code === '42501' || err?.status === 401 || err?.status === 403 || /permission|jwt|apikey/i.test(msg)) {
    return new ErroDados('O banco recusou a leitura (permissão/RLS ou chave inválida).', e)
  }
  if (err?.code === '42P01' || err?.code === '42703' || /does not exist/i.test(msg)) {
    return new ErroDados('Uma tabela ou coluna esperada não existe mais no banco. Avise o responsável técnico.', e)
  }
  return new ErroDados(`Erro ao consultar o banco: ${msg}`, e)
}

// ---------------------------------------------------------------------
//  Cache simples em memória (evita buscar tudo de novo a cada clique)
// ---------------------------------------------------------------------
const cache = new Map<string, { expira: number; promessa: Promise<unknown> }>()

function comCache<T>(chaveCache: string, buscar: () => Promise<T>): Promise<T> {
  const agora = Date.now()
  const item = cache.get(chaveCache)
  if (item && item.expira > agora) return item.promessa as Promise<T>
  const promessa = buscar().catch((e) => {
    cache.delete(chaveCache) // não guarda erro: a próxima tentativa busca de novo
    throw traduzir(e)
  })
  cache.set(chaveCache, { expira: agora + CONFIG.cacheMinutos * 60_000, promessa })
  return promessa
}

/** Esquece tudo o que foi guardado (botão "Atualizar"). */
export function limparCache() {
  cache.clear()
}

/** Lê todas as linhas, de 1000 em 1000 (limite do Supabase por consulta). */
async function todas<T>(tabela: string, colunas: string, ordem: string): Promise<T[]> {
  const PAGINA = 1000
  const out: T[] = []
  for (let de = 0; ; de += PAGINA) {
    const { data: linhas, error } = await sb.from(tabela).select(colunas).order(ordem).range(de, de + PAGINA - 1)
    if (error) throw error
    out.push(...(linhas as T[]))
    if (!linhas || linhas.length < PAGINA) return out
  }
}

// ---------------------------------------------------------------------
//  Funções públicas
// ---------------------------------------------------------------------
function enriquecerCurso(c: CursoBanco): Curso {
  return {
    ...c,
    ativo: (c.status ?? '').toLowerCase() === 'ativo',
    modalidadeCurta: modalidadeCurta(c.modalidade),
    ccC: conceito(c.cc),
    cpcC: conceito(c.cpc),
    enadeC: conceito(c.ultimo_conceito_enade),
    aberturaReconhecimento: data(c.abertura_processo_reconhecimento),
  }
}

function enriquecerPolo(p: PoloBanco): Polo {
  const situacao = (p.situacao ?? '').toLowerCase()
  return {
    ...p,
    ativo: situacao === 'ativo',
    situacaoTexto: capitalizar(situacao) || 'Não informada',
    uf: ufDe(p.estado),
    codigo: codigoPolo(p.codigo_emec_polo, p.codigo_emec_polo_extracted, p.nome_polo),
    dataCadastro: data(p.data_cadastro),
  }
}

/** Todos os cursos de graduação (ativos e inativos). */
export function getCursos(): Promise<Curso[]> {
  return comCache('cursos', async () => {
    const linhas = await todas<CursoBanco>('cursos', COLUNAS_CURSO.join(','), 'curso')
    return linhas.map(enriquecerCurso)
  })
}

/** Um curso pelo id (usa a lista em cache). */
export async function getCurso(id: string): Promise<Curso | null> {
  const cursos = await getCursos()
  return cursos.find((c) => c.id === id) ?? null
}

/** Todos os polos (ativos e inativos). */
export function getPolos(): Promise<Polo[]> {
  return comCache('polos', async () => {
    const linhas = await todas<PoloBanco>('polos', COLUNAS_POLO.join(','), 'nome_polo')
    return linhas.map(enriquecerPolo)
  })
}

/** Resultados das avaliações in loco (autorização e reconhecimento) por curso. */
export function getResultadosAvaliacao(): Promise<ResultadoAvaliacao[]> {
  return comCache('resultados_avaliacao_curso', () =>
    todas<ResultadoAvaliacao>(
      'resultados_avaliacao_curso',
      'id,curso_label,area_concentracao,conceito_autorizacao,conceito_reconhecimento,dim1_autorizacao,dim1_reconhecimento,dim2_autorizacao,dim2_reconhecimento,dim3_autorizacao,dim3_reconhecimento',
      'curso_label',
    ),
  )
}

/** Data/hora da última sincronização da planilha com o banco (tabela sync_log). */
export function getUltimaSincronizacao(): Promise<Date | null> {
  return comCache('sync_log', async () => {
    const { data: linhas, error } = await sb.from('sync_log').select('synced_at').order('synced_at', { ascending: false }).limit(1)
    if (error) throw error
    return linhas?.[0]?.synced_at ? new Date(linhas[0].synced_at) : null
  })
}
