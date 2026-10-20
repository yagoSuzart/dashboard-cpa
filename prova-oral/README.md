# OralLab · Prova Oral de Odontologia

Site de estudo para a prova oral de **DTM, Dor Orofacial e Cirurgia**: resumos, flashcards, simulados com correção explicada e casos clínicos com resposta escrita.

Não precisa de login nem de servidor: são só arquivos HTML, CSS e JavaScript. O progresso de cada aluno fica salvo no navegador dele.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Página do site |
| `css/estilo.css` | Visual (cores bordô/marsala, vidro espelhado, animações) |
| `js/dados.js` | Conteúdo dos temas: resumos, termos, flashcards e questões |
| `js/casos.js` | Prova oral: casos em que o paciente (ator) pergunta o que tem, por que acontece e o que fazer |
| `js/app.js` | Funcionamento (navegação, simulado, prova oral, desempenho) |

## Ajustes rápidos

- **Código da turma**: no início de `js/app.js`, troque `codigoTurma: 'ODONTO26'`. Deixe `''` para não pedir código.
  O código é só um filtro simples: quem tiver o link e o código entra.
- **Conteúdo**: edite `js/dados.js` (temas) e `js/casos.js` (prova oral). O formato está explicado no topo de cada arquivo.

## Publicar no Cloudflare Pages (sem programação)

1. Compacte o **conteúdo** desta pasta num `.zip` (o `index.html` precisa ficar na raiz do zip, não dentro de outra pasta).
2. No painel do Cloudflare: **Workers & Pages → Criar → Pages → Enviar arquivos (Upload assets)**.
3. Dê um nome ao projeto (ex.: `orallab-odonto`) e arraste o `.zip`.
4. Clique em **Implantar (Deploy)**. O site fica em `https://orallab-odonto.pages.dev`.

Para atualizar depois: no projeto, **Criar nova implantação (Create deployment)** e envie o novo `.zip`.

## Testar no computador

Abra o `index.html` direto no navegador, ou rode `python3 -m http.server` nesta pasta e acesse `http://localhost:8000`.
