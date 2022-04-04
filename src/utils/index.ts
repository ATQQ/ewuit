import { uiWrapperClass } from '@/components/ui-tool';
import { PixelConversion } from '@/types';
import { Toast } from '../components';

/**
 * 创建HtmlElement
 * @param tag 标签名
 * @returns
 */
export function h(tag: string, className?:string|string[]) {
  const dom = document.createElement(tag);
  if (className) {
    addClass(dom, className);
  }
  return dom;
}

/**
 * 节流函数
 * @param fn 待处理函数
 * @param delay 冷却时间（默认1000ms）
 * @returns
 */
export function throttle(fn, delay = 1000) {
  let start = 0;
  return function _call(...rest) {
    if (start + delay >= Date.now()) {
      return;
    }
    start = Date.now();
    fn.apply(this, rest);
  };
}

/**
 * 克隆页面
 * @returns 包含Body与Head的shadow Dom对象
 */
export function clonePage(scroll = true) {
  const shadowDom = h('div');
  addToHtml(shadowDom);
  shadowDom.attachShadow({ mode: 'open' });

  const { shadowRoot } = shadowDom;

  // 阻止触发默认事件
  preventDomDefault(shadowDom, 'click');

  // 使用拷贝页面作为新页面使用
  const tBody = document.body.cloneNode(true) as HTMLElement;
  const tHead = document.head.cloneNode(true) as HTMLElement;

  if (!scroll) {
    // 阻止上下滑手势触发页面滚动
    preventTouchMove(shadowDom);
    // TODO:阻止滚动
  }

  // 移除工具创建的ui-tool
  tBody.querySelector(`.${uiWrapperClass}`)?.remove();
  tBody.querySelectorAll('div[class^="ewuit-comp-"]').forEach((v) => {
    v.remove();
  });

  // 将拷贝的Body与Head 插入创建的shadow dom中
  shadowRoot?.append(tHead);
  shadowRoot?.append(tBody);

  // 将clone的页面盖在原来的页面上
  updateDomStyles(shadowDom, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: '100%',
  });

  // ----- 下面处理避免页面闪烁 ------
  // 将clone的视图滚动到原视图一样的位置，避免与原视图不一致
  assignmentDomStyle(tBody, document.body);

  // 一段时间后，完成布局后
  setTimeout(() => {
    // 添加zIndex 避免原页面元素的层级过高，元素隐藏后，原页面显现出来
    updateDomStyles(shadowDom, {
      zIndex: '5000',
    });
    // 恢复透明度
    // updateDomStyles(tBody, {
    //   opacity: '1',
    // });
  }, 500);

  return shadowDom;
}

/**
 * 对齐cloneDom的样式（包含Style与ScrollTop）
 * 阻止一些默认行为
 */
function assignmentDomStyle(cloneDom: HTMLElement, originDom: Element) {
  // 对齐scrollTop与Left
  // 同时禁止滚动
  if (originDom?.scrollTop && cloneDom) {
    cloneDom.scrollTop = originDom.scrollTop;
    cloneDom.style.overflowY = 'hidden';
  }
  if (originDom?.scrollLeft && cloneDom) {
    cloneDom.scrollLeft = originDom.scrollLeft;
    cloneDom.style.overflowX = 'hidden';
  }

  // 处理标签 inline onclick
  if (cloneDom?.getAttribute('onclick')) {
    cloneDom.removeAttribute('onclick');
    cloneDom.onclick = function _() {};
  }

  // TODO:确保是同一个DOM（不是非常精准）
  if (
    cloneDom?.tagName.toLowerCase() !== 'script'
    && cloneDom?.className === originDom?.className
  ) {
    // 对齐一些会影响布局样式
    const stylePropertyList = ['margin', 'padding', 'border', 'fontSize'];
    const originStyles = getComputedStyle(originDom);

    stylePropertyList.forEach((k) => {
      if (cloneDom.style) {
        cloneDom.style[k] = originStyles[k];
      }
    });
  }

  if (originDom?.childElementCount > 0 && cloneDom?.childElementCount > 0) {
    const originChildren = Array.from(originDom.children);
    const cloneChildren = Array.from(cloneDom.children);
    originChildren.forEach((v, idx) => {
      const cloneDom = cloneChildren[idx];
      // 递归
      assignmentDomStyle(cloneDom as HTMLElement, v);
    });
  }
}

/**
 * 阻止手势触发滚动
 */
export function preventTouchMove(el: HTMLElement) {
  preventDomDefault(el, 'touchmove', () => {
    Toast('禁止屏幕滑动');
  });
}

/**
 * 阻止触发默认事件
 */
export function preventDomDefault(
  el: HTMLElement,
  eventName: string,
  callback?: any,
) {
  if (el) {
    el.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        if (typeof callback === 'function') {
          callback();
        }
      },
      { passive: false },
    );
  }
}

/**
 * 更新Dom的样式
 */
export function updateDomStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  if (el?.style) {
    Object.assign(el.style, styles);
  }
}

/**
 * 更新Dom Display值
 * @param display 值（默认 block）
 */
export function updateDomDisplay(el?: HTMLElement | HTMLElement[], display = 'block') {
  const update = (e) => {
    if (e?.style) {
      e.style.display = display;
    }
  };
  setTimeout(() => {
    [el].flat().forEach(update);
  });
}

/**
 * 获取视图的高度
 */
export function getScreenHeight() {
  return document.documentElement.clientHeight;
}

/**
 * 获取视图的宽度
 */
export function getScreenWidth() {
  return document.documentElement.clientWidth;
}

/**
 * 判断DOM是不是纯文字内容元素
 */
export function isTextDom(dom: Element) {
  return dom.childElementCount === 0 && dom?.textContent?.replace(/\n|\s/g, '');
}

/**
 * 判断是不是图片元素
 */
export function isImgDom(dom: Element) {
  const imgTagList = ['img', 'image'];
  const tagName = dom.tagName.toLowerCase();
  const isBgImg = getComputedStyle(dom).backgroundImage !== 'none';
  return imgTagList.includes(tagName) || isBgImg;
}

/**
 * 格式化特定属性的值
 * @param propName 样式属性
 * @param value 属性值
 * @param options (可选)配置项
 * @returns label(属性中文)，格式化后的值
 */
export function stylePropConvert(
  propName: keyof CSSStyleDeclaration,
  value: string | number,
  options?: {
    pixelConversion?: PixelConversion
    styles?: CSSStyleDeclaration
  },
) {
  // 设置默认参数
  options = {
    pixelConversion(px) {
      return `${px}`;
    },
    ...options,
  };

  const { pixelConversion = defaultPixelConversion, styles } = options || {};
  // TODO: 兼容
  const chineseMap = {
    fontSize: '字号',
    fontFamily: '字体',
    color: '字色',
    backgroundColor: '背景',
    borderRadius: '圆角',
    border: '描边',
  };
  // TODO:待改造
  const label = chineseMap[propName];
  switch (propName) {
    case 'fontFamily':
      break;
    case 'color':
    case 'backgroundColor':
      value = rgbaToHex(`${value}`);
      break;
    case 'fontSize':
    case 'borderRadius':
      // 可能存在4个角不一样的情况
      value = `${value}`.split(' ').map((b) => pixelConversion(b)).join(' ');
      break;
    case 'border':
      if (styles) {
        const { borderWidth, borderStyle, borderColor } = styles;
        value = `${pixelConversion(borderWidth)} ${borderStyle} ${rgbaToHex(borderColor)}`;
      }
      break;
    default:
      break;
  }
  return {
    label,
    value,
  };
}
/**
 * 十进制转16进制
 * @param v 十进制数
 * @returns
 */
function tenToHex(v: number) {
  return v.toString(16);
}

/**
 * RGB(A)转化为HEX 表示的色值的
 * @param v rgb(a)表示的颜色 (例：rgb(255,255,255))
 * @returns #ffffff 0%
 */
function rgbaToHex(v: string) {
  v = v.replace(/[()\srgba]/g, '');
  const numList = v.split(',').map((v) => +v);

  // rgb
  if (numList.length === 3) {
    numList.push(0);
  }
  const hex = `#${numList
    .slice(0, 3)
    .map((v) => {
      const t = tenToHex(v);
      // f => 0f
      return t.length === 1 ? `0${t}` : t;
    })
    .join('')} ${numList[3] * 100}%`;
  return hex;
}

/**
 * 通过style标签向目标DOM添加css样式
 * @param target 目标DOM
 * @param style 样式
 */
export function addStyleDom(target: HTMLElement, style: string) {
  const styleDom = h('style');
  styleDom.textContent = style;
  target.append(styleDom);
}

/**
 * 向body中插入目标Dom
 */
export function addToBody(el: HTMLElement) {
  document.body.append(el);
}
/**
 * 向html节点下插入目标Dom
 */
export function addToHtml(el: HTMLElement) {
  document.documentElement.append(el);
}

/**
 * Dom 添加类名
 */
export function addClass(el: HTMLElement | HTMLElement[], cls: string[]|string) {
  cls = [cls].flat();
  if (el instanceof Array) {
    el.forEach((v) => {
      v.classList.add(...cls);
    });
    return;
  }
  el.classList.add(...cls);
}

/**
 * px转换显示
 * @param px
 * @returns
 */
export function defaultPixelConversion(px: number | string, unit = 'px', base = getScreenWidth()) {
  const viewWidth = getScreenWidth();
  if (typeof px === 'string') {
    px = +px.replace('px', '');
  }
  const value = (px / (viewWidth / base)).toFixed(1);
  return `${value.replace('.0', '')}${unit}`;
}

export function getDomRects(el: HTMLElement) {
  return el.getClientRects()[0];
}

export function getRootStylePropertyValue(key: string) {
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(key);
}

export function setRootStyleProperty(key: string, value: string) {
  document.documentElement.style.setProperty(key, value, 'important');
}

export function unitValue(value: string|number, unit = 'px') {
  return `${value}${unit}`;
}
