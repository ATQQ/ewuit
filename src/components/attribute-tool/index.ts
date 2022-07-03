import { publicTool } from '@/components'
import { AttributeToolConfig } from '@/types'
import {
  addStyleDom,
  defaultPixelConversion,
  getDomRects,
  getRootStylePropertyValue,
  getScreenHeight,
  getScreenWidth,
  h,
  isImgDom,
  isTextDom,
  stylePropConvert,
  updateDomDisplay,
  updateDomStyles,
  unitValue,
  setRootStyleProperty,
  addToHtml
} from '@/utils'
import { updateCoverDom } from '../public'
import style from './style.css'

class ElementTool {
  private clickDom!: HTMLElement

  private coverDom!: HTMLElement

  private modalDom!: HTMLElement

  private cfg: AttributeToolConfig

  constructor() {
    this.initCover()
    this.initAttrModal()

    // 默认配置
    this.cfg = {
      pixelConversion: defaultPixelConversion
    }
  }

  /**
   * 更新/获取组件的配置
   * @param cfg 新的配置
   * @returns
   */
  config(cfg?: Partial<AttributeToolConfig>): AttributeToolConfig | any {
    if (cfg) {
      Object.assign(this.cfg, cfg)
    }
    return this.cfg
  }

  /**
   * 处理控件点击
   */
  handle(e: MouseEvent) {
    if (!publicTool.handle(e)) {
      this.clear()
      return
    }
    this.clickDom = e.target as HTMLElement

    this.refreshCover()
    this.refreshModal()
  }

  /**
   * 生成彩色遮罩
   */
  initCover() {
    const coverDom = h('div', 'ewuit-comp-cover')
    addStyleDom(coverDom, style)
    addToHtml(coverDom)

    this.coverDom = coverDom
  }

  /**
   * 生成属性弹窗
   */
  initAttrModal() {
    const modalDom = h('div', 'ewuit-comp-modal')
    updateDomDisplay(modalDom, 'none')
    addStyleDom(modalDom, style)

    // 优化交互，如果点击弹窗，则取消选中的dom
    modalDom.addEventListener('click', () => {
      this.clear()
    })

    addToHtml(modalDom)
    this.modalDom = modalDom
  }

  refreshModal() {
    const { clickDom } = this
    const styles = getComputedStyle(clickDom)
    const domRect = getDomRects(clickDom)
    const pxToOther = this.cfg.pixelConversion || defaultPixelConversion

    let data: any = []

    // 确定要展示的属性
    let attrs: (keyof CSSStyleDeclaration)[] = []
    // TODO:优化空间
    if (isTextDom(clickDom)) {
      attrs = ['fontFamily', 'fontSize', 'color']
    }

    if (isImgDom(clickDom)) {
      attrs = ['borderRadius', 'border', 'backgroundColor']
    }

    // 展示一些块元素共有的
    if (attrs.length === 0) {
      attrs = ['borderRadius', 'border', 'backgroundColor']
    }
    // 数据格式化
    data = attrs.map((v) =>
      stylePropConvert(v, styles[v] as string, {
        pixelConversion: pxToOther,
        styles
      })
    )

    // 默认都要展示宽高
    data.unshift({
      label: '宽高',
      value: `${pxToOther(domRect.width)}/${pxToOther(domRect.height)}`
    })

    // 更新展示数据
    this.modalDom.innerHTML = `<div class="ewuit-comp-wrapper">
    ${data.map((v) => `<p><span>${v.label}:</span> ${v.value}</p>`).join('')}
    </div>`

    updateDomDisplay(this.modalDom)

    // TODO:优化
    // 在DOM已经在页面渲染完成后再调整位置
    setTimeout(() => {
      // bufferX用于处理页面被缩小的情况
      // 页面缩小，会按缩小的倍数放大弹窗，于是弹窗的位置会有一个buffer值进行位置的兼容
      // 暂不使用，有兼容性问题，端内放大后显示模糊，偏移值计算异常
      const bufferWidth = 0
      const bufferHeight = 0

      // const { width, height } = getDomRects(this.modalDom) || { width: 0, height: 0 }
      const modalScale = +getRootStylePropertyValue('--modal-scale') || 1
      // if (modalScale > 1) {
      //   let change = 1 / modalScale
      //   bufferHeight = ~~((height / 2) * change)
      //   bufferWidth = ~~((width / 2) * change)
      // }

      const screenHeight = getScreenHeight()
      const screenWidth = getScreenWidth()

      // 弹框在安全距离内才展示再下方
      const safeTopDistance = 200 * modalScale

      // 弹窗距离点击元素的垂直距离
      const verticalDistance = 10

      // 展示位置计算
      const left =
        domRect.left < screenWidth / 2
          ? unitValue(domRect.left + bufferWidth)
          : 'auto'
      const top =
        domRect.bottom + safeTopDistance < screenHeight
          ? unitValue(domRect.bottom + verticalDistance + bufferHeight)
          : 'auto'
      const right =
        left === 'auto'
          ? unitValue(screenWidth - domRect.left - domRect.width + bufferWidth)
          : 'auto'
      const bottom =
        top === 'auto'
          ? unitValue(
              screenHeight - domRect.top + verticalDistance + bufferHeight
            )
          : 'auto'

      // 更新位置
      updateDomStyles(this.modalDom, {
        left,
        top,
        right,
        bottom
      })
    })
  }

  /**
   * 刷新遮罩
   */
  refreshCover() {
    setRootStyleProperty(
      '--cover-attribute-border-radius',
      getComputedStyle(this.clickDom).borderRadius
    )
    updateCoverDom(this.clickDom, this.coverDom, this.cfg.pixelConversion)
    updateDomDisplay(this.coverDom)
  }

  clear() {
    updateDomDisplay(this.coverDom, 'none')
    updateDomDisplay(this.modalDom, 'none')
  }
}

export default new ElementTool()
