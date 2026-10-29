import { montar } from '../lib/html'
import { estadoVazio } from '../ui/componentes'

export function paginaPainel(el: HTMLElement) {
  montar(el, estadoVazio('Em construção', 'Esta tela entra nas próximas etapas.', '🚧'))
}
