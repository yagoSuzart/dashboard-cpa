# Hub Regulatório · UniFECAF

Portal interno do Setor Regulatório que reúne **cursos, polos, situação regulatória e documentos** em um só lugar.
É um site **estático**: não tem servidor próprio. Ele lê o banco Supabase *hub-regulatorio-unifecaf* (só leitura)
e acessa o Google Drive com o login de quem está usando.

> **Sem IA.** Nenhuma parte do Hub usa IA/LLM. Os números vêm do banco e são calculados no navegador.

## Telas

| Tela | O que faz | Bloco |
| --- | --- | --- |
| **Painel** (`#/`) | Contadores calculados dos dados reais: cursos e polos ativos, CC/CPC abaixo da meta, ENADE, polos por UF/região, prazos de abertura do reconhecimento | 2 (esboço) |
| **Cursos** (`#/cursos`) | Busca, filtros (modalidade, situação, grau, conceitos), ordenação, paginação, exportar CSV | 1 |
| **Ficha do curso** (`#/cursos/<id>`) | Todos os dados do curso, atos, prazos, coordenação, avaliação in loco, links | 1 |
| **Polos** (`#/polos`) | 712 polos com busca, filtros (UF, região, situação), ordenação, paginação, CSV e detalhe | 1 |
| **Repositório** (`#/repositorio`) | Pastas do Google Drive: navegar, lista/grade, buscar no nome e **dentro do texto** dos documentos (índice do próprio Drive), abrir, enviar arquivos | 3 (esboço) |
| **Diligências** / **Acessos** | Só o planejamento, sem dados | 4 e 5 |

## Como rodar no computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
cd hub-regulatorio
```

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço que aparecer (normalmente `http://localhost:5173`).

Outros comandos:

- `npm run check`: confere os tipos (TypeScript) sem gerar nada.
- `npm run build`: confere os tipos e gera a pasta `dist/`, que é o site pronto.
- `npm run preview`: abre o conteúdo de `dist/` para testar antes de publicar.

## Onde fica cada coisa

```
hub-regulatorio/
  index.html            app shell (menu lateral + topo)
  src/config.ts         ÚNICO ponto de configuração (Supabase, Client ID do Google, pastas, atalhos)
  src/main.ts           liga o menu e as rotas às páginas
  src/styles/           design system: tokens.css (cores, fontes, espaços), base, componentes, shell
  src/lib/dados.ts      ÚNICO lugar que conversa com o Supabase (getCursos, getPolos…), com cache e erros
  src/lib/normaliza.ts  padroniza dados da planilha (estado → UF, "4.0" → 4, "S/C", datas dd/mm/aaaa)
  src/lib/html.ts       montagem de HTML segura (escapa tudo que vem do banco: proteção contra XSS)
  src/lib/drive.ts      login Google + Drive API
  src/lib/csv.ts        exportação CSV para Excel
  src/ui/               componentes: tabela, tags, modal, vazio, carregando, erro, indicadores, barras
  src/paginas/          uma página por arquivo
  sql/                  propostas de SQL (NÃO executadas)
  legacy/               os HTML antigos, guardados sem alteração
```

Regras do código:

1. Página nenhuma faz consulta ao banco: tudo passa por `src/lib/dados.ts`.
2. HTML é sempre montado com `` html`...` `` (de `src/lib/html.ts`), que escapa os dados automaticamente.
   Links vindos do banco passam por `urlSegura()`, que só aceita `http(s)`.
3. Cores, fontes e espaçamentos só via variáveis de `src/styles/tokens.css`.

## Dados

- Banco: Supabase `ozqlgsolivftewmwksva` (região sa-east-1). Tabelas lidas: `cursos`, `polos`,
  `resultados_avaliacao_curso`, `sync_log`.
- A chave em `src/config.ts` é a **publishable**, que é pública por design. Quem protege os dados são as regras RLS.
  **Nunca** coloque a chave `service_role` no front-end.
- O Hub **só lê**. Para corrigir um dado, edite no painel do Supabase. A edição pelo Hub chega com o login (Bloco 5).
- Os dados ficam em cache por 5 minutos (`CONFIG.cacheMinutos`). O botão **Atualizar** busca de novo.

### O que falta no banco

- **Vencimento de atos autorizativos:** não existe coluna de data de validade. Proposta de tabela em
  `sql/proposta-rls-NAO-EXECUTADO.sql` (item 3).
- **Qualidade dos dados:**
  - nomes de estado com grafias diferentes ("Sãp Paulo", "Parará", "Rio De Janeiro"); o Hub padroniza só na tela;
  - códigos e-MEC salvos como "1627421.0";
  - CPC/CC/ENADE guardados como texto ("S/C", "NÃO HÁ").

## Publicar no Cloudflare (Worker com static assets)

> ⚠️ **O nome do Worker define o endereço.** Hoje `hub-regulatorio-unifecaf.yago-brito.workers.dev` é o **Consult**.
> O `wrangler.jsonc` usa o nome **`hub-regulatorio-v2`** para **não sobrescrever** o Consult.
> Só troque para `hub-regulatorio-unifecaf` quando decidir substituir o Consult.

### Opção A: pelo terminal (wrangler)

```bash
cd hub-regulatorio
```

```bash
npx wrangler login
```

```bash
npm run deploy
```

O comando gera o build e publica em `https://hub-regulatorio-v2.yago-brito.workers.dev`.

### Opção B: pelo painel (sem terminal)

1. Cloudflare → *Workers & Pages* → *Create* → *Import a repository*: escolha `dashboard-cpa`.
2. **Root directory:** `hub-regulatorio` · **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy`.
3. A cada push na branch configurada, o Cloudflare publica de novo.

## Configurar o Google Drive (Client ID)

Enquanto o Client ID estiver vazio, o Repositório funciona em **modo somente leitura**: as pastas abrem direto no Drive.

1. Acesse <https://console.cloud.google.com/> e crie (ou escolha) um projeto, por exemplo "Hub Regulatório".
2. *APIs e serviços* → *Biblioteca* → ative a **Google Drive API**.
3. *APIs e serviços* → *Tela de consentimento OAuth*: tipo **Interno**. Assim só contas @fecaf.com.br entram,
   e o escopo do Drive não precisa de verificação do Google.
4. *APIs e serviços* → *Credenciais* → *Criar credenciais* → **ID do cliente OAuth** → tipo **Aplicativo da Web**.
   - **Origens JavaScript autorizadas:** o endereço onde o Hub foi publicado, por exemplo
     `https://hub-regulatorio-v2.yago-brito.workers.dev`. Para testar no computador, adicione também `http://localhost:5173`.
   - Não precisa de "URI de redirecionamento".
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e cole em `src/config.ts`, no campo `google.clientId`.
   Outra opção é cadastrar a variável `VITE_GOOGLE_CLIENT_ID` no build do Cloudflare.
6. Publique de novo.

Detalhes:

- **Permissão pedida:** `drive` (navegar nas pastas e enviar arquivos). Cada pessoa só vê o que já pode ver no Drive.
- **Token:** fica só na memória da aba. Ao recarregar a página, é preciso entrar de novo.
- **Pastas iniciais:** ficam em `CONFIG.pastasRaiz`.

## Segurança: pendências no banco (não executadas)

Veja `sql/proposta-rls-NAO-EXECUTADO.sql`:

1. `link_overrides_pos_emec` e `link_overrides_curso_guia` estão **sem RLS**: qualquer um pode alterar ou apagar.
   Antes de rodar, confirmar se o Consult grava nelas pelo navegador.
2. `visitas_polos`, `visita_fotos` e `visita_anexos` aceitam **inserir e apagar sem login**.
