import { publicTool } from '@/components';
import { DistanceToolConfig } from '@/types';
import {
  addStyleDom,
  addToHtml,
  defaultPixelConversion,
  getDomRects,
  h,
  setRootStyleProperty,
  unitValue,
  updateDomDisplay,
  updateDomStyles,
} from '@/utils';
import { updateCoverDom } from '../public';
import distanceStyle from './style.css';

class DistanceTool {
  // 最近点击的两个元素
  private domStack: HTMLElement[];

  // 存放组件相关的所有DOM
  private compDom: HTMLElement;

  // 彩色遮罩
  private firstCover!: HTMLElement;

  private secondCover!: HTMLElement;

  // 虚线标尺
  private rulers!: HTMLElement;

  private vRuler!: HTMLElement;

  private hRuler!: HTMLElement;

  // 测距线
  private distanceWrapper!: HTMLElement;

  // 4根线(对应上下左右)
  private distanceList!: HTMLElement[];

  private cfg: DistanceToolConfig;

  constructor() {
    this.domStack = [];

    this.compDom = h('div', 'ewuit-comp-distance-wrapper');
    addToHtml(this.compDom);
    addStyleDom(this.compDom, distanceStyle);

    this.initCover();

    this.initRulers();

    this.initDistanceLine();

    // 默认配置
    this.cfg = {
      pixelConversion: defaultPixelConversion,
    };
  }

  /**
   * 更新/获取组件的配置
   * @param cfg 新的配置
   * @returns
   */
  config(cfg?: Partial<DistanceToolConfig>): DistanceToolConfig | any {
    if (cfg) {
      Object.assign(this.cfg, cfg);
    }
    return this.cfg;
  }

  /**
   * 初始化遮罩
   */
  initCover() {
    this.firstCover = h('div', 'ewuit-comp-cover-first');
    this.secondCover = h('div', 'ewuit-comp-cover-second');
    this.compDom.append(this.firstCover);
    this.compDom.append(this.secondCover);
  }

  /**
   * 初始化标尺
   */
  initRulers() {
    const rulers = h('div', 'ewuit-comp-rulers');
    const vRuler = h('div', ['ruler', 'v']);
    const hRuler = h('div', ['ruler', 'h']);

    // 初始化DOM结构
    this.compDom.append(rulers);
    rulers.append(vRuler);
    rulers.append(hRuler);

    this.rulers = rulers;
    this.vRuler = vRuler;
    this.hRuler = hRuler;
  }

  /**
   * 初始化测距线
   */
  initDistanceLine() {
    const wrapper = h('div', 'ewuit-distanceWrapper');
    const v1 = h('div', ['distance', 'v']);
    const v2 = h('div', ['distance', 'v']);
    const h1 = h('div', ['distance', 'h']);
    const h2 = h('div', ['distance', 'h']);
    wrapper.append(v1, v2, h1, h2);

    this.compDom.append(wrapper);
    this.distanceList = [v1, v2, h1, h2];
    this.distanceWrapper = wrapper;
  }

  /**
   * 处理点击
   */
  handle(e: MouseEvent) {
    if (!publicTool.handle(e, 4)) {
      this.clear();
      return;
    }

    const clickDom = e.target as HTMLElement;
    const { domStack } = this;

    // 是否连续点击两个一样的
    const isSameClick = domStack.at(-1) === clickDom;

    if (!isSameClick) {
      domStack.push(clickDom);
    }

    // 已经选中[1,2]在点2，变换为[2]
    if (isSameClick && domStack.length === 2) {
      domStack.shift();
    }
    if (domStack.length === 3) {
      domStack.shift();
    }

    // 控制尺寸的展示
    setRootStyleProperty('--cover-size-display', domStack.length === 1 ? 'block' : 'none');
    // 控制距离展示
    setRootStyleProperty('--cover-distance-display', domStack.length === 1 ? 'none' : 'block');

    this.refreshCover();
    this.refreshRulers();
    this.refreshDistance();
  }

  /**
   * 更新标尺位置
   */
  refreshRulers() {
    const targetDom = this.domStack[1];
    if (!targetDom) {
      updateDomDisplay(this.rulers, 'none');
      return;
    }
    const {
      left, width, height, top,
    } = getDomRects(targetDom);
    updateDomStyles(this.vRuler, {
      left: unitValue(left),
      width: unitValue(width),
    });
    updateDomStyles(this.hRuler, {
      top: unitValue(top),
      height: unitValue(height),
    });

    updateDomDisplay(this.rulers);
  }

  /**
   * 更新两个遮罩的位置
   */
  refreshCover() {
    const [first, second] = this.domStack;
    setRootStyleProperty('--cover-distance-first-border-radius', getComputedStyle(first).borderRadius);
    this.updateCover(first, this.firstCover);
    setRootStyleProperty('--cover-distance-second-border-radius', getComputedStyle(first).borderRadius);
    this.updateCover(second, this.secondCover);
  }

  /**
   * 更新测距线的位置
   */
  refreshDistance() {
    const { pixelConversion = defaultPixelConversion } = this.cfg;
    // 先全部隐藏
    updateDomDisplay(this.distanceList, 'none');

    // 紫&蓝
    const [comparedDom, targetDom] = this.domStack;

    // 上下左右4根线
    const [up, down, left, right] = this.distanceList;
    if (!targetDom) return;
    const cData = getDomRects(comparedDom);
    const tData = getDomRects(targetDom);

    // TODO: 优化
    // 计算某个方向的差值

    // 展示up
    if (cData.top > tData.bottom) {
      up.setAttribute('data-v', pixelConversion(cData.top - tData.bottom));

      updateDomStyles(up, {
        height: unitValue(cData.top - tData.bottom),
        left: unitValue(cData.left + cData.width / 2),
        top: unitValue(tData.bottom),
      });
      updateDomDisplay(up);
    }
    if (cData.top < tData.bottom && cData.top > tData.top && cData.bottom < tData.bottom) {
      up.setAttribute('data-v', pixelConversion(cData.top - tData.top));

      updateDomStyles(up, {
        height: unitValue(cData.top - tData.top),
        left: unitValue(cData.left + cData.width / 2),
        top: unitValue(tData.top),
      });
      updateDomDisplay(up);
    }

    // 展示left
    if (cData.left > tData.right) {
      left.setAttribute('data-v', pixelConversion(cData.left - tData.right));

      updateDomStyles(left, {
        width: unitValue(cData.left - tData.right),
        left: unitValue(tData.right),
        top: unitValue(cData.top + cData.height / 2),
      });
      updateDomDisplay(left);
    }
    if (cData.left < tData.right && cData.left > tData.left && cData.right <= tData.right) {
      left.setAttribute('data-v', pixelConversion(cData.left - tData.left));

      updateDomStyles(left, {
        width: unitValue(cData.left - tData.left),
        left: unitValue(tData.left),
        top: unitValue(cData.top + cData.height / 2),
      });
      updateDomDisplay(left);
    }
    // 展示right
    if (cData.right < tData.left) {
      right.setAttribute('data-v', pixelConversion(tData.left - cData.right));

      updateDomStyles(right, {
        width: unitValue(tData.left - cData.right),
        left: unitValue(cData.right),
        top: unitValue(cData.top + cData.height / 2),
      });
      updateDomDisplay(right);
    }
    if (cData.right > tData.left && cData.right < tData.right && cData.left >= tData.left) {
      right.setAttribute('data-v', pixelConversion(tData.right - cData.right));

      updateDomStyles(right, {
        width: unitValue(tData.right - cData.right),
        left: unitValue(cData.right),
        top: unitValue(cData.top + cData.height / 2),
      });
      updateDomDisplay(right);
    }

    // 展示down
    if (cData.bottom < tData.top) {
      down.setAttribute('data-v', pixelConversion(tData.top - cData.bottom));

      updateDomStyles(down, {
        height: unitValue(tData.top - cData.bottom),
        left: unitValue(cData.left + cData.width / 2),
        top: unitValue(cData.bottom),
      });
      updateDomDisplay(down);
    }
    if (cData.bottom > tData.top && cData.bottom < tData.bottom && cData.top >= tData.top) {
      down.setAttribute('data-v', pixelConversion(tData.bottom - cData.bottom));

      updateDomStyles(down, {
        height: unitValue(tData.bottom - cData.bottom),
        left: unitValue(cData.left + cData.width / 2),
        top: unitValue(cData.bottom),
      });
      updateDomDisplay(down);
    }
    updateDomDisplay(this.distanceWrapper);
  }

  /**
   * 将遮罩位置更新到与DOM一致
   * @param e
   * @param target
   */
  private updateCover(el: HTMLElement, target: HTMLElement) {
    if (!el) {
      updateDomDisplay(target, 'none');
      return;
    }
    updateCoverDom(el, target, this.cfg.pixelConversion);
    updateDomDisplay(target);
  }

  clear() {
    this.domStack = [];
    updateDomDisplay(this.firstCover, 'none');
    updateDomDisplay(this.secondCover, 'none');
    updateDomDisplay(this.rulers, 'none');
    updateDomDisplay(this.distanceWrapper, 'none');
  }
}

export default new DistanceTool();
