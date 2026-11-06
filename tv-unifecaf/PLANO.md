# Mural da TV UniFECAF · Plano e roadmap

Documento vivo. A especificação original está em `PROJETO-TV-UNIFECAF.md`; a versão 1 está em `tv-unifecaf.html`.

## 1. Diagnóstico da versão 1

A base é boa: tela fixa 1920x1080 escalada, conteúdo separado do visual, textos que encolhem para caber, `validade`
e fuso fixo. Antes de crescer, há quatro pontos que ferem os requisitos "nunca quebrar" e "funcionar sem ninguém":

| # | Problema | Consequência | Correção (Fase 0) |
| --- | --- | --- | --- |
| 1 | `location.reload()` a cada 30 min sem checar a internet | Se a rede cair na hora do reload, a TV fica na tela de erro do navegador **até alguém mexer** | Antes de recarregar, testar se o servidor responde; se não, continuar exibindo o que já tem |
| 2 | Fonte (Google Fonts) e QR (cdnjs) vêm da internet | Sem rede na inicialização: fonte trocada e QR vira texto | Guardar fonte e biblioteca do QR junto do site, sem depender de CDN |
| 3 | Sem cache offline | TV religada sem internet = tela em branco | *Service worker*: guarda página, avisos e imagens; abre a última versão mesmo offline |
| 4 | Tema segue o "modo escuro" do aparelho | Cada TV pode mostrar um tema diferente | Tema definido por TV no link (já existe `#claro`/`#escuro`); padrão fixo |

Detalhes menores: a lista "Nesta tela hoje" da abertura não encolhe títulos longos; não existe data de início;
imagens embutidas deixam o arquivo pesado.

## 2. Arquitetura proposta

Ideia central: **a TV só lê um arquivo de avisos** (JSON). Quem gera esse arquivo muda com as fases, mas a TV não.

```
[ fonte do conteúdo ]  ──>  avisos.json + imagens  ──>  mural (página estática)  ──>  TV
  Fase 1: arquivo no GitHub                                  │
  Fase 3: painel + Supabase                                  └── cache offline (service worker)
```

- **Mural**: continua HTML + CSS + JS puro, sem React e sem build. É o que você já entende, e TV não precisa de mais.
- **Hospedagem**: Cloudflare Pages ligado a este repositório (você já usa; grátis; publica sozinho a cada commit).
  Netlify serve igualmente. **Artifact do Claude não é recomendado** para a TV: depende do claude.ai, não dá
  para controlar cache offline e cada atualização passa pelo Claude.
- **Uma TV = um link**: `mural.../?tv=recepcao`. Cada aviso diz em quais TVs aparece (padrão: todas).

### Fonte do conteúdo: opções

| Opção | Prós | Contras | Quando |
| --- | --- | --- | --- |
| **A. `avisos.json` no repositório** | Simples, grátis, histórico de quem mudou o quê, funciona com cache offline | Só quem tem acesso ao GitHub edita; editar JSON assusta | **Fase 1** (só você publica) |
| B. Google Planilha publicada (CSV) | Setores já sabem usar planilha; coluna "Aprovado" vira o fluxo de aprovação | Imagem é difícil (links do Drive falham na TV); planilha aceita qualquer coisa e erros de digitação chegam à TV | Atalho opcional se os setores precisarem publicar antes do painel ficar pronto |
| **C. Supabase + painel** | Login Google institucional (já configurado), aprovação, upload de imagem com compressão, pré-visualização exata, regras de acesso no banco (RLS) | Mais coisas para construir e manter | **Fase 3** |

Sobre a regra "nada de senhas no código": a chave *publishable/anon* do Supabase **pode** ficar na página, é feita
para isso. O que protege os dados são as regras RLS no banco (a TV só lê avisos aprovados; só gente logada envia;
só você aprova). A chave secreta (*service role*) nunca vai para o navegador.

## 3. Roadmap em fases

Cada fase termina com o mural funcionando e publicado.

### Fase 0 · Robustez (curta, faço logo depois das respostas)
- Mover o mural para `tv-unifecaf/` publicado no Cloudflare Pages.
- Corrigir os itens 1 a 4 do diagnóstico (recarga segura, fonte e QR locais, cache offline, tema fixo).
- Indicador discreto "sem conexão, exibindo conteúdo de DD/MM HH:MM" no rodapé quando estiver offline.

### Fase 1 · Marca e conteúdo real
- Aplicar o manual de marca (cores, fontes, logo) só nas variáveis do CSS.
- Tirar `AVISOS` do HTML para `avisos.json`; imagens em `imagens/` (arquivos normais, não embutidos).
- Novo campo `inicio` (data e hora) além de `validade`.
- Página `previa.html`: abre um slide específico para conferir antes de publicar.
- Guia em português: "como publicar um aviso pelo site do GitHub" (sem instalar nada).

### Fase 2 · Programação
- `prioridade` (normal / alta: aparece 2x por volta), `turnos` (manhã, tarde, noite), `tvs` (playlists por local).
- **Modo emergência**: um aviso com `emergencia: true` toma a tela até ser removido. Para entrar rápido, a TV
  passa a consultar o `avisos.json` a cada 2 minutos (sem recarregar a página) em vez de esperar 30 minutos.
- Novos tipos simples: `contador` (ex.: "faltam X respostas para a meta da CPA", número digitado), `horarios`
  (funcionamento/cardápio), `boas_vindas`.

### Fase 3 · Painel para os setores
- Tabela `tv_avisos` no Supabase com status `rascunho → enviado → aprovado / recusado`.
- Painel web (login Google @fecaf.com.br): formulário por tipo de slide, **pré-visualização usando o próprio
  motor do mural** (fica idêntico à TV), upload com recorte e compressão no navegador.
- Tela de aprovação para você (e quem você indicar).
- O mural lê os aprovados direto do Supabase e mantém a última cópia no cache offline.

### Fase 4 · Monitoramento e integrações (escolher conforme a necessidade)
- Cada TV avisa a cada 5 min "estou ligada, versão X"; painel mostra TVs sem sinal.
- Google Calendar institucional → slides de evento automáticos.
- Clima de São Paulo na abertura (Open-Meteo, sem chave).
- CPA: participação ao vivo e "Você falou, nós fizemos" lendo do Portal CPA.
- CEP: calendário de reuniões e prazos de submissão.
- Vídeo curto mudo em loop (exige teste no aparelho escolhido).
- Redes sociais: deixo por último. As APIs do Instagram exigem conta comercial e token que expira; costuma
  dar mais trabalho do que postar a arte manualmente como `imagem_cheia`.

## 4. Hardware (recomendação)

| Aparelho | Inicia sozinho | Offline | Avaliação |
| --- | --- | --- | --- |
| Navegador da smart TV | Não | Varia por marca | Evitar: não abre sozinho após queda de energia, pode exibir pop-ups |
| Chromecast antigo (só "transmitir") | Não | Não | Não serve: precisa de um celular/PC transmitindo |
| **Fire TV Stick / Chromecast com Google TV / TV box Android + Fully Kiosk Browser** | Sim | Sim | **Recomendado**: barato, abre o link ao ligar, mantém tela acesa, recarrega se travar |
| Mini PC ou PC antigo no HDMI com Chrome em modo quiosque | Sim (T.I configura) | Sim | Ótimo e o mais previsível, se houver máquina sobrando |

Em qualquer caso, o T.I precisa desligar no menu da TV o "desligamento automático"/"economia de energia" e,
se possível, ativar "ligar com o sinal HDMI" (HDMI-CEC).
