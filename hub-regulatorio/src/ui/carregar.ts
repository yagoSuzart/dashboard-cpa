// Padrão de carregamento de toda página: mostra "carregando", depois o conteúdo
// ou a mensagem de erro com o botão "Tentar de novo".
import { montar } from '../lib/html'
import { ErroDados, limparCache } from '../lib/dados'
import type { Contexto } from '../lib/router'
import { carregando, estadoErro } from './componentes'

export async function carregarPagina<T>(
  el: HTMLElement,
  ctx: Contexto,
  buscar: () => Promise<T>,
  desenhar: (dados: T) => void,
  textoCarregando?: string,
) {
  montar(el, carregando(textoCarregando))
  try {
    const dados = await buscar()
    if (!ctx.ativo()) return // usuário já mudou de tela
    desenhar(dados)
  } catch (e) {
    if (!ctx.ativo()) return
    console.error(e)
    const msg = e instanceof ErroDados ? e.message : 'Erro inesperado ao montar a tela.'
    montar(el, estadoErro(msg))
    el.querySelector('[data-acao="tentar-de-novo"]')?.addEventListener('click', () => {
      limparCache()
      carregarPagina(el, ctx, buscar, desenhar, textoCarregando)
    })
  }
}

/** Lê os parâmetros depois do "?" na rota, ex.: #/cursos?conceito=abaixo-minimo */
export function parametrosDaRota(): URLSearchParams {
  return new URLSearchParams(location.hash.split('?')[1] ?? '')
}

/** Busca os dados de novo no banco e redesenha a tela atual (botão "Atualizar"). */
export function recarregarTela() {
  limparCache()
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
