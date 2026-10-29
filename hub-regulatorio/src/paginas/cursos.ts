import { montar } from '../lib/html'
import { estadoVazio } from '../ui/componentes'

export function paginaCursos(el: HTMLElement) {
  montar(el, estadoVazio('Em construção', 'Esta tela entra nas próximas etapas.', '🚧'))
}

export function paginaFichaCurso(el: HTMLElement) {
  montar(el, estadoVazio('Em construção', 'Esta tela entra nas próximas etapas.', '🚧'))
}
