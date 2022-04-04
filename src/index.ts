// 引入 Array.prototype.at垫片
import 'core-js/modules/esnext.array.at';
import { UITool, attributeTool, distanceTool } from '@/components';
import { FUN_TYPE } from '@/constants';
import { addStyleDom, clonePage, getScreenHeight } from '@/utils';
import varStyle from './assets/var.css';
import { EwuitOps } from './types';

class Ewuit {
  private shadowPage: HTMLElement | null;

  constructor(options:Partial<EwuitOps>) {
    this.shadowPage = null;
    addStyleDom(document.body, varStyle);
    attributeTool.config(options?.toolConfig?.attributeTool);
    distanceTool.config(options?.toolConfig?.distanceTool);
    // TODO: 特殊处理meta viewport 不是1的情况
  }

  openUI() {
    UITool.init({
      distance: (v) => {
        this.call(FUN_TYPE.DISTANCE, v);
      },
      attribute: (v) => {
        this.call(FUN_TYPE.ATTRIBUTE, v);
      },
    });
  }

  closeUI() {
    UITool.destroy();
  }

  call(methodName: FUN_TYPE, status = true) {
    // 处理Clone页面的逻辑
    if (status) {
      if (this.shadowPage) {
        return;
      }
      this.shadowPage = clonePage();
      // 特殊处理body高度超过视图的，阻止其滑动
      if (document.body.scrollHeight >= getScreenHeight()) {
        const t = document.body;
        t.setAttribute('data-overflow', t.style.overflow);
        t.style.overflow = 'hidden';
      }
    } else if (this.shadowPage) {
      this.shadowPage.remove();
      // 恢复原DOM的overflow
      document.body.style.overflow = document.body.getAttribute('data-overflow') || 'visible';
      this.shadowPage = null;
      attributeTool.clear();
      distanceTool.clear();
      return;
    }

    const cloneBody = this.shadowPage?.shadowRoot?.querySelector('body');
    // 激活对应功能
    switch (methodName) {
      case FUN_TYPE.ATTRIBUTE:
        cloneBody?.addEventListener('click', attributeTool.handle.bind(attributeTool));
        break;
      case FUN_TYPE.DISTANCE:
        cloneBody?.addEventListener('click', distanceTool.handle.bind(distanceTool));
        break;
      default:
        break;
    }
  }
}

export default Ewuit;
