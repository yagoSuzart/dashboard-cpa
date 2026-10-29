// Bloco 4 (planejado) · Diligências. Sem dados ainda: a tela só descreve o que vai existir.
import { html, montar } from '../lib/html'
import { aviso, cabecalho, estadoVazio, ficha } from '../ui/componentes'

export function paginaDiligencias(el: HTMLElement) {
  montar(
    el,
    html`${cabecalho({
        codigo: 'MOD·04 · Controle de diligências',
        titulo: 'Diligências',
        descricao: 'Registro manual de diligências do e-MEC/INEP, com prazo e responsável, para nenhum prazo passar despercebido.',
      })}
      ${aviso(
        html`<b>Bloco 4 — ainda não iniciado.</b> Gravar diligências exige login (Bloco 5), porque hoje o banco só permite leitura pública.
          Nenhuma diligência é mostrada aqui até existir a tabela e o cadastro.`,
        'info',
      )}
      <div class="grid-2">
        <section class="card">
          <h2 class="card-title">Campos previstos de cada diligência</h2>
          ${ficha([
            ['Processo e-MEC', 'número do processo'],
            ['Curso ou polo', 'ligado ao cadastro do Bloco 1'],
            ['Tipo', 'autorização, reconhecimento, renovação, credenciamento…'],
            ['Recebida em', 'data'],
            ['Prazo de resposta', 'data (alerta automático)'],
            ['Responsável', 'pessoa do setor'],
            ['Situação', 'aberta, em resposta, respondida, arquivada'],
            ['Documentos', 'link para a pasta no Repositório'],
          ])}
        </section>
        <section class="card">
          <h2 class="card-title">Lista de diligências</h2>
          ${estadoVazio('Nenhuma diligência cadastrada', 'O cadastro entra no Bloco 4, depois do login.', '⏱️')}
        </section>
      </div>`,
  )
}
