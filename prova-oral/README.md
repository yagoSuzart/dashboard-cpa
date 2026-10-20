# OralLab · Prova Oral de Odontologia

Site de estudo para a prova oral de **DTM, Dor Orofacial e Cirurgia**: resumos, perguntas e respostas, flashcards, simulados com correção explicada e casos com paciente-ator.

Não precisa de login nem de servidor: são só arquivos HTML, CSS e JavaScript. O progresso de cada aluno fica salvo no navegador dele.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Página do site |
| `css/estilo.css` | Visual (cores bordô/marsala, vidro espelhado, animações) |
| `js/dados.js` | Conteúdo dos temas: resumos, termos, flashcards e questões |
| `js/casos.js` | Prova oral: casos em que o paciente (ator) pergunta o que tem, por que acontece e o que fazer |
| `js/perguntas.js` | Perguntas e respostas: pergunta, resposta direta e um "por quê" curto |
| `js/app.js` | Funcionamento (navegação, simulado, prova oral, desempenho) |
| `manifest.webmanifest`, `icones/` | Permitem instalar o OralLab na tela do celular, como um app |
| `sw.js` | Faz o site funcionar sem internet depois do primeiro acesso |

## Ajustes rápidos

- **Código da turma**: no início de `js/app.js`, troque `codigoTurma: 'ODONTO26'`. Deixe `''` para não pedir código.
  O código é só um filtro simples: quem tiver o link e o código entra.
- **Conteúdo**: edite `js/dados.js` (temas), `js/perguntas.js` (perguntas e respostas) e `js/casos.js` (prova oral). O formato está explicado no topo de cada arquivo.

## Celular

O site foi feito pensando primeiro no celular: menu fixo embaixo, botões grandes para o dedo e dados do caso recolhidos na prova oral.
O aluno pode instalar pelo navegador ("Adicionar à tela inicial") e, depois do primeiro acesso, estudar mesmo sem internet.
Ao publicar uma versão nova, troque o número em `VERSAO` no início do `sw.js` (ex.: `orallab-v5`).

## Publicar no Cloudflare Pages (sem programação)

1. Compacte o **conteúdo** desta pasta num `.zip` (o `index.html` precisa ficar na raiz do zip, não dentro de outra pasta).
2. No painel do Cloudflare: **Workers & Pages → Criar → Pages → Enviar arquivos (Upload assets)**.
3. Dê um nome ao projeto (ex.: `orallab-odonto`) e arraste o `.zip`.
4. Clique em **Implantar (Deploy)**. O site fica em `https://orallab-odonto.pages.dev`.

Para atualizar depois: no projeto, **Criar nova implantação (Create deployment)** e envie o novo `.zip`.

## Testar no computador

Abra o `index.html` direto no navegador, ou rode `python3 -m http.server` nesta pasta e acesse `http://localhost:8000`.
