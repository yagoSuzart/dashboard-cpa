# Projeto: Mural Digital da TV UniFECAF

## Como usar este arquivo

Coloque este arquivo e o `tv-unifecaf.html` na mesma pasta e abra o Claude Code nela. Peça: "Leia o PROJETO-TV-UNIFECAF.md e o tv-unifecaf.html, me faça as perguntas que faltam e proponha um plano antes de escrever código."

## Contexto

Sou Analista de Regulatório da UniFECAF, responsável pelo acompanhamento da CPA (Comissão Própria de Avaliação) e secretário do Comitê de Ética em Pesquisa (CEP). Estou aprendendo a criar sites e automações para substituir planilhas e processos manuais.

A instituição tem uma TV parada por falta de conteúdo. A ideia é transformá-la num mural digital que fica o tempo todo passando informações relevantes da faculdade, em rotação, sem ninguém precisar mexer.

## Objetivo

Um mural que roda sozinho na TV, com visual da marca UniFECAF, que nunca quebra o layout e que seja fácil de atualizar. Hoje quem atualiza sou eu; no futuro, outros setores também devem conseguir publicar avisos sem mexer em código.

## O que já existe (versão 1)

Arquivo `tv-unifecaf.html`, uma página única (HTML, CSS e JavaScript no mesmo arquivo), sem servidor.

Funcionalidades prontas:

- Tela fixa de 1920x1080 que se ajusta a qualquer TV, então o layout é sempre o mesmo.
- Rotação automática de slides com barra de progresso.
- Separação entre design e conteúdo: o visual fica no CSS e o conteúdo fica numa lista `AVISOS` no JavaScript.
- Seis tipos de slide: `abertura` (relógio, data e lista do que passa hoje), `evento` (com contagem regressiva), `aviso`, `imagem_texto`, `qr` (QR code gerado na página) e `imagem_cheia` (qualquer formato de imagem, sem cortar nem esticar, com fundo desfocado).
- Ajuste automático do tamanho do texto quando ele não cabe.
- Campo `validade`: o aviso some sozinho depois da data.
- Recarrega a cada 30 minutos para pegar conteúdo novo.
- Wake Lock API e clique para tela cheia.
- Tema claro e escuro, que pode ser forçado com `#claro` ou `#escuro` no link.
- Fuso horário fixo em America/Sao_Paulo.

Formato de um aviso hoje:

```js
{ tipo:"evento", categoria:"Agenda", titulo:"Semana Acadêmica 2026",
  texto:"...", data:"2026-11-23", horario:"19h às 22h",
  local:"Auditório principal", validade:"2026-11-23", duracao:15 }
```

Limitações atuais: as cores e textos são de exemplo; as imagens precisam estar embutidas no arquivo; só eu consigo atualizar o conteúdo.

## Próximos passos já decididos

1. **Aplicar a marca:** vou organizar PDFs com manual de marca, cores, fontes, logo e informações reais. Atualizar só as variáveis de cor, fonte e logo, sem mudar a estrutura.
2. **Conteúdo real:** substituir os avisos de exemplo por avisos reais (CPA, CEP, agenda, biblioteca, secretaria, vestibular).

## Ideias para evoluir (quero discutir e priorizar)

**Atualização de conteúdo**
- Tirar a lista `AVISOS` do código e ler de uma fonte externa: Google Sheets publicado, Supabase ou um JSON no repositório.
- Painel simples de cadastro com formulário (tipo de slide, textos, imagem, datas, prioridade) e pré-visualização exata de como vai ficar na TV.
- Fluxo de aprovação: setores enviam avisos e eu aprovo antes de ir para a TV.
- Upload de imagem com recorte e compressão automáticos.

**Programação**
- Agendamento por data e hora de início, não só de fim.
- Prioridade: avisos urgentes aparecem mais vezes na rotação.
- Programação por horário do dia (manhã, tarde, noite), por causa de públicos e turnos diferentes.
- Modo emergência: um aviso que toma a tela toda até ser desativado.

**Mais de uma TV**
- Playlists por local (recepção, biblioteca, corredor dos laboratórios), cada TV com seu link.
- Monitoramento: cada TV avisa periodicamente que está ligada e qual versão está exibindo.

**Integrações**
- Agenda institucional (Google Calendar) gerando slides de evento automaticamente.
- Clima de São Paulo na abertura.
- CPA: indicadores de participação da avaliação em tempo real e seção "Você falou, nós fizemos".
- CEP: calendário de reuniões e prazos de submissão.
- Posts das redes sociais da faculdade.

**Novos tipos de slide**
- Vídeo curto (mudo, em loop).
- Aniversariantes ou boas-vindas a turmas.
- Cardápio ou horários de funcionamento.
- Ranking ou contador (ex.: "faltam X respostas para a meta da CPA").

## Requisitos que não podem mudar

- O layout nunca pode quebrar na TV, seja com texto longo, imagem de qualquer formato ou falta de conteúdo.
- Tem que funcionar sem ninguém por perto, inclusive se a internet cair por um tempo (considerar cache offline do último conteúdo).
- Leitura à distância: textos grandes, alto contraste, pouco texto por tela.
- Tudo em português do Brasil.
- Nada de senhas ou chaves expostas no código da página.
- Manter simples: sou iniciante em desenvolvimento, então prefiro soluções que eu consiga entender e manter. Explique as escolhas.

## Hospedagem e hardware

- Opções de hospedagem: artifact publicado no Claude, Netlify ou outra hospedagem estática.
- O T.I. precisa desativar o desligamento automático e a economia de energia no menu da TV, porque muitas TVs desligam após horas sem uso do controle, mesmo exibindo conteúdo.

## Perguntas em aberto

- Qual aparelho vai rodar o mural: navegador da smart TV, Chromecast, Fire TV Stick ou computador no HDMI? Isso muda as soluções para tela cheia, inicialização automática e modo offline.
- Quantas TVs existem ou vão existir, e onde?
- Quais setores vão publicar avisos, e quem aprova?
- O T.I. permite hospedar o mural num domínio da faculdade?
- Onde ficam hoje as informações (agenda, avisos, dados da CPA)?

## O que espero do Claude Code

1. Ler este arquivo e o HTML atual.
2. Fazer as perguntas que faltam antes de construir.
3. Propor uma arquitetura e um roadmap em fases, do mais simples ao mais completo, com prós e contras de cada opção.
4. Implementar uma fase por vez, mantendo o mural funcionando entre as fases.
