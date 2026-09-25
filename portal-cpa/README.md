# Portal CPA · UniFECAF

Resultados da CPA, pergunta por pergunta, comentários dos alunos e planos de ação num lugar só.
Usa o **mesmo banco** do Plano de Ação atual (Supabase *Plano de Ação - CPA*): mesmos usuários, senhas,
cursos, notas, comentários e planos. Nada é copiado nem apagado.

## Telas

| Tela | O que mostra | Quem vê |
| --- | --- | --- |
| **Visão geral** | Satisfação geral, termômetro das 5 dimensões com a meta 4,0, trilho dos planos, voz dos alunos, cursos que pedem atenção, setores | todos (cada um no próprio escopo) |
| **Cursos** | Notas do curso x instituição, mapa de calor das turmas, onde agir primeiro, planos do curso, notas por professor, comentários | coordenação, direção, CPA, Pró-Reitoria |
| **Pergunta por pergunta** | Cada pergunta de cada questionário com quantos alunos deram cada nota, média, NPS da recomendação; filtro por disciplina e professor no questionário Docente; comentários e planos da dimensão ao lado | todos (depois da importação) |
| **Comentários** | Todos os comentários com filtros e busca por palavras-chave, exatamente como os alunos escreveram | todos |
| **Planos de ação** | Os planos com o trilho de aprovação e o detalhe de cada um | todos |
| **Setores** | Nota de cada setor e de cada pergunta do setor | Pró-Reitoria/CPA; o próprio setor |
| **Importar CPA** | Lê a planilha de respostas (CSV), soma tudo no navegador, mostra a conferência e só grava se todas as linhas baterem | admin e Coordenação da CPA |

Escopo de cada pessoa (as mesmas regras do sistema atual): Pró-Reitoria, Coordenação da CPA, Comissão CPA e admin veem
todos os cursos; diretor(a) de núcleo vê os cursos que coordena e os do núcleo; coordenadores e professores auxiliares,
os cursos vinculados; setores, o próprio setor.

Nesta primeira versão, **criar, editar e aprovar planos continua no Portal do Coordenador atual**. O Portal mostra os
planos e o andamento de cada um. Essa etapa entra aqui na sequência (ver `INVENTARIO.md`).

## Notas da pesquisa

- Escala de 1 a 5, mostrada só como número ("X alunos deram 1"). A resposta 6 é de quem não utiliza aquele espaço
  ou serviço: aparece contada à parte e fica fora da média.
- Satisfação Geral vai de 0 a 10. Na pergunta "Recomenda a UniFECAF…", o Portal calcula o NPS
  (% de 9 e 10 menos % de 0 a 6).
- Na importação, CPF, RA e identificação de alunos **não saem do arquivo**. Vão para o banco só os totais por pergunta,
  curso, turma, disciplina e professor (tabela `cpa_resultados`).

## Publicar no mesmo endereço do Plano de Ação

O Portal fica no Worker **`cpa-unifecaf`** (`https://cpa-unifecaf.yago-brito.workers.dev`), o mesmo endereço de
sempre. O sistema anterior continua acessível em **`/antigo/`** até a migração terminar (link "Sistema anterior ↗"
no menu), porque criar e aprovar planos, agenda, PDFs e usuários ainda estão lá.

O `index.html` do sistema anterior **não vai para este repositório** (ele tem comentários e notas embutidos e o
repositório é público). Ele entra só no pacote que é enviado à mão.

1. `npm install && npm run build`
2. Criar a pasta `dist/antigo/` e colocar nela o `index.html` do sistema anterior.
3. Cloudflare → *Workers & Pages* → `cpa-unifecaf` → enviar a pasta `dist` (ou o `.zip` dela), como era feito com o
   `index.html`. Pela linha de comando: `npx wrangler deploy` (usa o `wrangler.jsonc`).
4. No Supabase *Plano de Ação - CPA* → *Authentication → URL Configuration → Redirect URLs*, ter
   `https://cpa-unifecaf.yago-brito.workers.dev/**` (o "Esqueci a senha" do Portal e do `/antigo/`).

`VITE_SISTEMA_ATUAL_URL` troca o endereço do sistema anterior (vazio esconde o link).

## Rodar no computador

```bash
cd portal-cpa
npm install
npm run dev
```
