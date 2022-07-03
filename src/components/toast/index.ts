import { addStyleDom, addToHtml, h, throttle } from '../../utils'
import toastStyle from './style.css'

type Toast = (string?: string, timeout?: number) => void

function toast(msg = '', timeout = 500) {
  const wrapper = h('div', 'ewuit-toast-wrapper')
  addStyleDom(wrapper, toastStyle)

  const p = h('p')
  p.textContent = msg
  wrapper.append(p)

  addToHtml(wrapper)
  setTimeout(() => {
    wrapper.remove()
  }, timeout)
}
export default throttle(toast, 500) as Toast
