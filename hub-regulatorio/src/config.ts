// =====================================================================
//  CONFIGURAÇÃO DO HUB REGULATÓRIO — único lugar para mudar endereços e chaves.
//  Nada aqui é segredo: a chave "publishable" do Supabase e o Client ID do Google
//  são públicos por natureza. NUNCA coloque aqui a chave service_role.
// =====================================================================

const env = import.meta.env

export const CONFIG = {
  supabase: {
    // Projeto hub-regulatorio-unifecaf (sa-east-1). Quem protege os dados são as regras (RLS) do banco.
    url: env.VITE_SUPABASE_URL || 'https://ozqlgsolivftewmwksva.supabase.co',
    chave: env.VITE_SUPABASE_KEY || 'sb_publishable_8mqFeW0LZ2PjKB5cDPD9rw_7-04XN7n',
  },

  google: {
    // ▼▼▼ COLE AQUI o Client ID criado no Google Cloud Console (termina em .apps.googleusercontent.com).
    //     Enquanto estiver vazio, o Repositório funciona em modo "somente leitura" (só abre as pastas no Drive).
    clientId: env.VITE_GOOGLE_CLIENT_ID || '',
    // Permissão pedida ao Google: navegar nas pastas e subir arquivos no Drive de quem entrar.
    escopo: 'https://www.googleapis.com/auth/drive',
  },

  // Pastas institucionais que aparecem como "raiz" do Repositório (as mesmas do portal antigo).
  pastasRaiz: [
    { id: '10rMQ3kRTy2fxxEjzitCKfpQZ3RQ8FZaF', nome: '0 · e-MEC', icone: '📁' },
    { id: '17-seDXAd-RETcIa6_Z4K5gTpEKdKeiVv', nome: '1 · Centro Universitário', icone: '🏛️' },
    { id: '1jPdW1OzyrqsUXiGWLir3Wid0k_x6NaRY', nome: '2 · Consultar', icone: '🔎' },
    { id: '1GKOGQajirflS1nPxG7ktx-pmOk8ARP6R', nome: '3 · Diretório geral e dos cursos', icone: '🎓' },
  ],

  // Atalhos para sistemas externos (menu lateral).
  atalhos: [
    { nome: 'Consult', url: 'https://hub-regulatorio-unifecaf.yago-brito.workers.dev/' },
    { nome: 'Visita virtual dos polos', url: 'https://paulosantos-art.github.io/visita-virtual-polos/login.html' },
    { nome: 'Metas institucionais', url: 'https://hub-regulatorio-unifecaf.netlify.app/' },
  ],

  // Regras de leitura dos conceitos do MEC (1 a 5).
  conceitos: {
    minimoSatisfatorio: 3, // abaixo disso o MEC considera insatisfatório
    metaInstitucional: 4, // meta do setor: conceito 4 ou 5
  },

  // Quanto tempo (em minutos) os dados lidos do banco ficam guardados antes de buscar de novo.
  cacheMinutos: 5,
} as const
