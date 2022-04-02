import { FUN_TYPE } from '@/constants';
import { UIInitOps } from '@/types';
import {
  addClass, addStyleDom, addToBody, h,
} from '@/utils';
import style from './index.scss';

const uiWrapperClass = 'ewuit-ui-tool-panel';

export default class EwuitUITool {
  private static ui: HTMLElement;

  private static btnTypeMap:WeakMap<HTMLElement, string> = new WeakMap();

  private static callbackList:Partial<UIInitOps>;

  static independenceButtonList: HTMLElement[] = [];

  static unIndependenceButtonList: HTMLElement[] = [];

  static bindTogglePanel(
    e: MouseEvent,
  ): void {
    // 获取旧状态
    const oldStatus = this.unIndependenceButtonList.reduce((pre, current) => {
      pre[this.btnTypeMap.get(current) as string] = current.classList.contains('active');
      return pre;
    }, {});

    // 状态改变
    const target:HTMLElement = e.target as HTMLElement;
    target.classList.toggle('active');
    if (this.btnTypeMap.has(target)) {
      this.unIndependenceButtonList.forEach((el) => {
        if (el !== target) {
          el.classList.remove('active');
        }
      });
    }

    // 获取新状态
    const newStatus = this.unIndependenceButtonList.reduce((pre, current) => {
      pre[this.btnTypeMap.get(current) as string] = current.classList.contains('active');
      return pre;
    }, {});

    // diff获取应该的行为
    const diffStatus = Object.keys(oldStatus).reduce((pre, current) => {
      if (newStatus[current] !== oldStatus[current]) {
        pre[current] = newStatus[current];
      }
      return pre;
    }, {});

    // 执行自定义回掉
    Object.keys(diffStatus).forEach((k) => {
      if (typeof this?.callbackList?.[k] === 'function') {
        this.callbackList[k](diffStatus[k]);
      }
    });
  }

  /**
   * 初始化独立工作面板
   */
  static init(callbackOps:Partial<UIInitOps> = {}) {
    this.callbackList = callbackOps;
    if (this.isExist()) return;
    this.independenceButtonList = [];
    this.unIndependenceButtonList = [];

    // 外层容器
    const toolTip = h('div');
    toolTip.classList.add(uiWrapperClass);
    addStyleDom(
      toolTip,
      style,
    );
    const attributeBtn = h('div');
    addClass(attributeBtn, 'attr-btn');
    this.btnTypeMap.set(attributeBtn, FUN_TYPE.ATTRIBUTE);

    const distanceBtn = h('div');
    addClass(distanceBtn, 'distance-btn');
    this.btnTypeMap.set(distanceBtn, FUN_TYPE.DISTANCE);

    this.unIndependenceButtonList.push(attributeBtn, distanceBtn);

    toolTip.appendChild(attributeBtn);
    toolTip.appendChild(distanceBtn);
    addToBody(toolTip);

    this.ui = toolTip;
    this.ui.addEventListener('click', this.bindTogglePanel.bind(this));
  }

  static destroy() {
    if (this.ui) {
      this.ui.removeEventListener('click', this.bindTogglePanel.bind(this));
      this.ui.remove();
    }
  }

  static isExist() {
    return !!document.querySelector(uiWrapperClass);
  }
}
