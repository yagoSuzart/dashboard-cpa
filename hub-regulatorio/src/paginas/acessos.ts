// Bloco 5 (planejado) · Perfis e permissões.
import { html, montar } from '../lib/html'
import { aviso, cabecalho, ficha } from '../ui/componentes'

export function paginaAcessos(el: HTMLElement) {
  montar(
    el,
    html`${cabecalho({
        codigo: 'MOD·05 · Perfis e permissões',
        titulo: 'Perfis e acessos',
        descricao: 'Quem pode ver e quem pode editar cada parte do Hub.',
      })}
      ${aviso(
        html`<b>Situação atual:</b> o Hub não tem login. Ele só <b>lê</b> o banco, com a chave pública (publishable), e as regras do banco (RLS) permitem
          apenas leitura. Correções de dados são feitas no painel do Supabase. O Repositório usa o login do Google de cada pessoa e respeita as permissões do Drive.`,
        'info',
      )}
      <section class="card">
        <h2 class="card-title">Plano para o Bloco 5</h2>
        ${ficha([
          ['Login', 'Supabase Auth (e-mail institucional @fecaf.com.br)'],
          ['Perfis', 'Regulatório (edita tudo), Procuradoria (vê tudo), Coordenação (vê o próprio curso)'],
          ['Escrita no banco', 'políticas RLS de INSERT/UPDATE só para usuários autenticados com perfil autorizado — nunca para anônimos'],
          ['Auditoria', 'quem alterou o quê e quando'],
        ])}
      </section>`,
  )
}
