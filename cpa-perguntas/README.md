# CPA UniFECAF · Banco de Perguntas

Painel para a Pró-Reitoria Acadêmica, a Coordenação da CPA e o T.I analisarem as perguntas
do instrumento de autoavaliação pelos **5 eixos e 10 dimensões do SINAES** e escolherem as
perguntas novas que devem entrar.

## O que o painel faz

| Tela | Para quê |
| --- | --- |
| **Visão geral** | Números do instrumento 2026.1 e o Mapa SINAES: quantas perguntas caem em cada dimensão e quais estão pendentes. |
| **Perguntas de hoje** | As perguntas em uso (aba *CPA Atual*), por eixo/dimensão ou por item da pesquisa. |
| **Montar a base** | Cada pessoa marca as propostas (aba *Perguntas Propostas por Eixo*) como **Entra**, **Dúvida** ou **Não entra**, com comentário. No modo *leitura às cegas* o eixo e a dimensão só aparecem depois da decisão. Dá para sugerir perguntas próprias. |
| **Cobertura e pendências** | Perguntas em uso + escolhidas: mostra se algum eixo ou dimensão ficou de fora. |
| **Outras abas (setores)** | NEAD, Onboarding, Empregabilidade etc., para não repetir perguntas. Também dá para marcar “Entra”. |
| **Relatório para o T.I** | Documento pronto (imprimir/PDF, Word ou copiar): perguntas novas, cobertura e perguntas mantidas. Textos sempre literais, como estão na planilha. |
| **Visão consolidada** *(só administradores)* | As escolhas de cada pessoa lado a lado, com consenso e divergências. |

Cada pessoa entra só com o **e-mail** (sem senha) e vê e edita apenas as próprias escolhas.

## Como funciona por dentro

- **Site**: React + Vite (pasta `src/`). A planilha é lida no navegador (`src/lib/xlsx.js`).
- **Planilha ao vivo**: a função `functions/api/planilha.js` baixa o `.xlsx` do Google Drive
  (cache de 2 minutos). Se não conseguir, o site usa a cópia `public/planilha.xlsx`.
- **Login sem senha**: Cloudflare Access com *One-time PIN* — a pessoa digita o e-mail e recebe um código.
  As funções conferem a assinatura do token do Access (`server/lib.js`) antes de ler ou gravar.
- **Escolhas**: Cloudflare KV, uma chave por e-mail (`functions/api/selecoes.js`).
- **Sem Cloudflare configurado** (local, Netlify ou antes de terminar os passos abaixo), o site abre em
  **modo demonstração**: sem login real e com as escolhas salvas só no navegador.

## Rodar no computador

```bash
cd cpa-perguntas
npm install
npm run dev
```

## Publicar no Cloudflare Pages (recomendado)

Tudo cabe no plano gratuito (Access é grátis até 50 pessoas).

1. **Planilha no Drive** — no arquivo, *Compartilhar → Qualquer pessoa com o link → Leitor*.
   O ID é o trecho entre `/d/` e `/edit` do link. Mantenha os nomes das abas *CPA Atual (por eixo)*
   e *Perguntas Propostas por Eixo* e os títulos das colunas; o resto pode mudar à vontade.
2. **Pages** — *Workers & Pages → Create → Pages → Connect to Git*, escolha este repositório e configure:
   - Root directory: `cpa-perguntas`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **KV** — *Storage & Databases → KV → Create namespace* (ex.: `cpa-perguntas`). No projeto do Pages,
   *Settings → Bindings → Add → KV namespace*, com o nome da variável **`CPA_KV`**.
4. **Login (Cloudflare Access)** — *Zero Trust → Access → Applications → Add an application → Self-hosted*:
   - Domínio: o endereço do site (ex.: `cpa-perguntas.pages.dev`) e, se quiser, também `*.cpa-perguntas.pages.dev` (versões de teste).
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
