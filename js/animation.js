export function animationMove(dom, to, timeout = 500, frames = 50, callback) { // 平移动画
  clearInterval(dom.timer);
  const interval = Math.round(timeout / frames); // timeout: 动画总时间, frames: 帧数
  let leftStep = (to.left - dom.offsetLeft) / timeout * interval;
  let topStep = (to.top - dom.offsetTop) / timeout * interval;
  // 将像素进行非零整数化
  leftStep = leftStep > 0 ? Math.ceil(leftStep) : Math.floor(leftStep);
  topStep = topStep > 0 ? Math.ceil(topStep) : Math.floor(topStep);
  leftStep = leftStep === 0 ? 1 : leftStep;
  topStep = topStep === 0 ? 1 : topStep;
  const absLeftStep = Math.abs(leftStep);
  const absTopStep = Math.abs(topStep);
  let leftDone = false;
  let topDone = false;
  dom.timer = setInterval(() => {
    if (!leftDone) {
      if (Math.abs(to.left - dom.offsetLeft) > absLeftStep) {
        dom.style.left = dom.offsetLeft + leftStep + 'px';
      } else {
        dom.style.left = to.left + 'px';
        leftDone = true;
      }
    }
    if (!topDone) {
      if (Math.abs(to.top - dom.offsetTop) > absTopStep) {
        dom.style.top = dom.offsetTop + topStep + 'px';
      } else {
        dom.style.top = to.top + 'px';
        topDone = true;
      }
    }
    if (leftDone && topDone) {
      clearInterval(dom.timer);
      delete dom.timer;
      if (callback) {
        callback();
      }
    }
  }, interval);
}

export function animationScale(dom, paramObject, timeout = 100, frames = 50, callback) { // 伸缩动画
  clearInterval(dom.timer);
  // domParam 中存放的是 scale === 1 时 dom 的参数; 如果 dom 已经在文档中, scale.from 所对应的参数必须与 dom 当前的相同
  const { parent, domParam, scale } = paramObject;
  const centerTop = domParam.top + domParam.height / 2;
  const centerLeft = domParam.left + domParam.width / 2;
  const aspectRatio = domParam.width / domParam.height;
  const fontSizeRatio = domParam.fontSize / domParam.height;
  const fromHeight = Math.round(domParam.height * scale.from);
  const toHeight = Math.round(domParam.height * scale.to);
  const interval = Math.round(timeout / frames); // timeout: 动画总时间, frames: 帧数
  let heightStep = (toHeight - fromHeight) / timeout * interval;
  // 将像素进行非零整数化
  heightStep = heightStep > 0 ? Math.ceil(heightStep) : Math.floor(heightStep);
  heightStep = heightStep === 0 ? 1 : heightStep;
  const absHeightStep = Math.abs(heightStep);
  function getDomParam(height) { // 根据 height 计算出 domParam
    const domParam = {
      height,
      width: Math.round(height * aspectRatio),
      lineHeight: height,
      fontSize: Math.round(height * fontSizeRatio),
      top: Math.round(centerTop - height / 2),
    }
    domParam.left = Math.round(centerLeft - domParam.width / 2);
    return domParam;
  }
  function addPixel(domParam) { // 为 domParam 加上像素单位
    let obj = {};
    for (let key of Object.keys(domParam)) {
      obj[key] = domParam[key] + 'px';
    }
    return obj;
  }
  if (!dom.isConnected) { // 如果 dom 不在文档中, 就把它插入文档
    Object.assign(dom.style, addPixel(getDomParam(fromHeight)));
    parent.appendChild(dom);
  }
  dom.timer = setInterval(() => {
    if (Math.abs(toHeight - dom.offsetHeight) > absHeightStep) {
      Object.assign(dom.style, addPixel(getDomParam(dom.offsetHeight + heightStep)));
    } else {
      if (scale.to === 1) {
        Object.assign(dom.style, addPixel(domParam));
      } else {
        Object.assign(dom.style, addPixel(getDomParam(toHeight)));
      }
      clearInterval(dom.timer);
      delete dom.timer;
      if (callback) {
        callback();
      }
    }
  }, interval);
}
