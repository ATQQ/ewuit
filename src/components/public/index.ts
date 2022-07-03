import { PixelConversion } from '@/types'
import { Toast } from '..'
import {
  getDomRects,
  getScreenWidth,
  updateDomStyles,
  unitValue
} from '@/utils'

/**
 * 更新元素彩色遮罩的展示
 * @param target 参照元素
 * @param coverDom 遮罩元素
 * @param pixelConversion px处理
 */
export function updateCoverDom(
  target: HTMLElement,
  coverDom: HTMLElement,
  pixelConversion?: PixelConversion
) {
  if (typeof pixelConversion !== 'function') {
    pixelConversion = (v) => `${v}`
  }
  const { top, left, width, height } = getDomRects(target)
  updateDomStyles(coverDom, {
    width: unitValue(width),
    height: unitValue(height),
    left: unitValue(left),
    top: unitValue(top)
  })
  // 设置展示的数值（单位）
  coverDom.setAttribute('data-w', pixelConversion(width))
  coverDom.setAttribute('data-h', pixelConversion(height))

  // TODO:可优化
  // 部分位置会出现遮挡，有弹窗弥补显示，问题不大
  // 安全宽度内，高度展示再右边，否则左边
  const isSafeWidth = getScreenWidth() - 50 > width + left
  // 这里使用了伪元素展示宽高数据，所以使用css变量去更新数据
  // 高度展示
  coverDom.style.setProperty(
    '--ewuit-comp-cover-left',
    isSafeWidth ? 'auto' : '-46px'
  )
  coverDom.style.setProperty(
    '--ewuit-comp-cover-right',
    isSafeWidth ? '0' : 'auto'
  )

  const isSafeHeight = top > 20
  // 宽度展示
  coverDom.style.setProperty(
    '--ewuit-comp-cover-bottom',
    isSafeHeight ? 'auto' : '20px'
  )
  coverDom.style.setProperty(
    '--ewuit-comp-cover-top',
    isSafeHeight ? '-20px' : 'auto'
  )
}

class PublicTool {
  private clickStack: HTMLElement[]

  constructor() {
    this.clickStack = []
  }

  /**
   * @returns 是否继续处理后续逻辑
   */
  handle(e: MouseEvent, frequentClickRemoveTimes?: number) {
    const clickDom = e.target as HTMLElement
    return this.frequentClickRemove(clickDom, frequentClickRemoveTimes)
  }

  /**
   * 频繁点击同一DOM处理
   */
  frequentClickRemove(clickDom: HTMLElement, times = 3) {
    this.clickStack.push(clickDom)
    // 点击第 times+1 次将第一次的移除栈
    if (this.clickStack.length === times + 1) {
      this.clickStack.shift()
    }

    // 连续点击次数计算
    const clickTimes = this.clickStack.reduce((pre, v, idx) => {
      if (v === clickDom) {
        return pre + 1
      }
      if (idx !== 0) {
        return pre - 1
      }
      return pre
    }, 0)

    // Toast提示一下，连续点击 times-1 次
    if (clickTimes === times - 1) {
      Toast('再点击一次即可移除此节点', 1200)
    }

    // 达到 times 次,隐藏目标节点
    if (clickTimes === times) {
      // 并不是真的移除，避免影响布局
      clickDom.style.visibility = 'hidden'
      this.clear()
      return false
    }
    return true
  }

  clear() {
    this.clickStack = []
  }
}

export default new PublicTool()
