# Perguntas-CPA · Banco de Perguntas da CPA UniFECAF

Painel para a Pró-Reitoria Acadêmica, a Coordenação da CPA e o T.I analisarem as perguntas
do instrumento de autoavaliação pelos **5 eixos e 10 dimensões do SINAES** e escolherem as
perguntas novas que devem entrar.

## O que o painel faz

| Tela | Para quê |
| --- | --- |
| **Visão geral** | Números do instrumento 2026.1 e o Mapa SINAES: quantas perguntas caem em cada dimensão e quais estão pendentes. |
| **Perguntas de hoje** | As perguntas em uso (aba *CPA Atual*), por eixo/dimensão ou por item da pesquisa. |
| **Montar a base** | Cada pessoa marca as propostas (aba *Perguntas Propostas por Eixo*) como **Entra**, **Dúvida** ou **Não entra**, com comentário. O eixo e a dimensão aparecem em cada proposta; quem preferir pode ligar a *leitura às cegas*, que só mostra os dois depois da decisão. Dá para **editar a redação** (o original da planilha fica guardado ao lado) e **criar perguntas** escolhendo eixo, dimensão e tipo de resposta. |
| **Cobertura e pendências** | Perguntas em uso + escolhidas: mostra se algum eixo ou dimensão ficou de fora. |
| **Outras abas (setores)** | NEAD, Onboarding, Empregabilidade etc., para não repetir perguntas. Também dá para marcar “Entra”. |
| **Relatório para o T.I** | Documento pronto (imprimir/PDF, Word ou copiar): perguntas novas, cobertura e perguntas mantidas. Textos sempre literais, como estão na planilha. |
| **Visão consolidada** *(só administradores)* | **Gabarito SINAES** (todos os eixos e dimensões atendidos? o que falta incrementar?), perguntas criadas pelas avaliadoras e as escolhas de cada pessoa lado a lado, com consenso, divergências e redações sugeridas. |
| **Sobre o sistema** | O que é o painel, como funciona, segurança, tecnologia, próximos passos e novidades. Textos editáveis em `src/lib/config.js`. |

Atalho: **Ctrl + K** (ou ⌘ + K) abre a busca rápida em todas as perguntas e telas.

Cada pessoa entra com a **conta Google institucional** (sem senha nova) e vê e edita apenas as próprias escolhas.

## Como funciona por dentro

- **Site**: React + Vite (pasta `src/`). A planilha é lida no navegador (`src/lib/xlsx.js`).
- **Planilha ao vivo**: a função `functions/api/planilha.js` (Cloudflare Pages) baixa o `.xlsx` do Google Drive
  (cache de 2 minutos). Se não conseguir, o site usa a cópia `public/planilha.xlsx`.
- **Login com Google + escolhas**: Supabase (projeto *hub-regulatorio-unifecaf*), configurado em `src/lib/config.js`.
  - `pcpa_autorizados`: quem pode entrar (e quem é administrador). O administrador libera e remove acessos na tela
    *Visão consolidada → Quem pode entrar*.
  - `pcpa_selecoes`: as escolhas de cada pessoa (uma linha por e-mail).
  - As regras de acesso ficam no banco (Row Level Security): cada pessoa só lê e grava a própria linha; só
    administradores leem todas; contas que não estão na lista não veem nada.
- **Modo demonstração**: se o Supabase não estiver configurado, as escolhas ficam só no navegador.
- **Alternativa Cloudflare Access + KV**: as funções `functions/api/me|selecoes|consolidado.js` continuam no projeto
  para quem preferir o login do Cloudflare (exige cartão cadastrado no Zero Trust). Não são usadas quando o Supabase
  está configurado.

### Ativar o "Entrar com Google" (uma vez só)

1. **Google Cloud Console** (console.cloud.google.com), com a conta institucional:
   - Crie um projeto (ex.: `Perguntas-CPA`).
   - *Google Auth Platform → Branding*: nome do app `Perguntas-CPA`, e-mail de suporte.
   - *Audience*: **Internal** (só contas @fecaf.com.br). Se não aparecer, use *External* e adicione os e-mails em *Test users*.
   - *Clients → Create client → Web application*. Em **Authorized redirect URIs**, coloque
     `https://ozqlgsolivftewmwksva.supabase.co/auth/v1/callback`. Copie o **Client ID** e o **Client secret**.
2. **Supabase** (projeto hub-regulatorio-unifecaf):
   - *Authentication → Sign In / Providers → Google*: ative, cole o Client ID e o Client secret e salve.
   - *Authentication → URL Configuration*: em **Redirect URLs**, adicione `https://perguntas-cpa.pages.dev/**`.

## Rodar no computador

```bash
cd perguntas-cpa
npm install
npm run dev
```

## Publicar no Cloudflare Pages (recomendado)

Tudo cabe no plano gratuito (Access é grátis até 50 pessoas).

1. **Planilha no Drive** — no arquivo, *Compartilhar → Qualquer pessoa com o link → Leitor*.
   O ID é o trecho entre `/d/` e `/edit` do link. Mantenha os nomes das abas *CPA Atual (por eixo)*
   e *Perguntas Propostas por Eixo* e os títulos das colunas; o resto pode mudar à vontade.
2. **Pages** — *Workers & Pages → Create → Pages → Connect to Git*, escolha este repositório e configure:
   - Root directory: `perguntas-cpa`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **KV** — *Storage & Databases → KV → Create namespace* (ex.: `perguntas-cpa`). No projeto do Pages,
   *Settings → Bindings → Add → KV namespace*, com o nome da variável **`CPA_KV`**.
4. **Login (Cloudflare Access)** — *Zero Trust → Access → Applications → Add an application → Self-hosted*:
   - Domínio: o endereço do site (ex.: `perguntas-cpa.pages.dev`) e, se quiser, também `*.perguntas-cpa.pages.dev` (versões de teste).
   - Policy: *Allow*, *Include → Emails* com os e-mails autorizados.
   - *Authentication*: marque **One-time PIN**.
   - Depois de salvar, copie o **Application Audience (AUD) Tag**.
5. **Variáveis** — no projeto do Pages, *Settings → Variables and Secrets*:

   | Variável | Exemplo | Para quê |
   | --- | --- | --- |
   | `DRIVE_FILE_ID` | `1oITipbOVmutut-MpIXtRtpKxr9AJ7wgj` | Planilha ao vivo do Drive |
   | `ACCESS_TEAM_DOMAIN` | `suaequipe.cloudflareaccess.com` | Equipe do Zero Trust (*Settings → Custom Pages*) |
   | `ACCESS_AUD` | `4714c1358e65fe4b408ad6d432a5f878…` | AUD Tag do passo 4 |
   | `ADMIN_EMAILS` | `voce@fecaf.com.br` | Quem vê a *Visão consolidada* (separe por vírgula) |
   | `NOMES` | `a@fecaf.com.br=Pró-Reitora Acadêmica;b@fecaf.com.br=Coordenadora da CPA` | Nome exibido de cada pessoa (opcional) |
   | `ALLOWED_EMAILS` | `a@fecaf.com.br,b@fecaf.com.br` | Camada extra além da policy do Access (opcional) |

6. Faça um novo deploy (*Deployments → Retry deployment*). Ao abrir o site, o Cloudflare pede o e-mail e envia o código.

## Netlify

O `netlify.toml` já está pronto, mas no Netlify o site roda só em **modo demonstração** (sem login real e sem
escolhas compartilhadas). Para o fluxo completo, use o Cloudflare Pages.

## Atualizar a cópia local da planilha

Se o Drive estiver fora do ar, o site usa `public/planilha.xlsx`. Para atualizar essa cópia, substitua o arquivo
e faça um novo deploy.
