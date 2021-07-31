import { animationMove, animationScale } from "./animation.js";
import { camelToKebab, indexOfLastElement, randomInteger, randomValue, removeUnit } from "./utils.js";

class Card {
  constructor(dom = null, value = null) {
    this.dom = dom;
    this.value = value;
  }
}

class ToPosition {
  constructor(rowIndex, colIndex, isMerge = false, isMove = true) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.isMerge = isMerge;
    this.isMove = isMove;
  }
}

class Game {
  constructor() {
    this.container = [];
    this.count = 0;
    this.score = 0;
    this.best = 0;
    this.lengthOfSide = 4;
    this.totalCount = this.lengthOfSide * this.lengthOfSide;
    this.cardSize = {
      columnGap: 0,
      rowGap: 0,
      totalWidth: 0,
      totalHeight: 0
    };
    this.gameContainer = document.getElementById('game-container');
    this.scoreDom = document.getElementById('score');
    this.bestDom = document.getElementById('best');
    this.animationParams = { // 动画相关的时间参数
      moveTimeout: 120,
      moveFrames: 20,
      scaleTimeout: 50,
      scaleFrames: 10
    };
    this.isClosed = false; // 用于节流
    this.eventHandlers = {};
    this.keyupEventListener = null;
    this.unhandledEvents = []; // 尚未处理的事件
    this.start();
  }
  start() {
    this.container = this.createNullContainer();
    this.initCardSize();
    this.eventHandlers = {
      'ArrowRight': this.arrowRight.bind(this),
      'ArrowUp': this.arrowUp.bind(this),
      'ArrowLeft': this.arrowLeft.bind(this),
      'ArrowDown': this.arrowDown.bind(this),
    };
    this.keyupEventListener = this.keyupCallback.bind(this);
    const newGameButton = document.getElementById('new-game');
    newGameButton.addEventListener('click', this.newGame.bind(this));
    window.addEventListener('pageshow', this.showData.bind(this));
    window.addEventListener('pagehide', this.storeData.bind(this));
  }
  createNullContainer() {
    const container = [];
    for (let i = 0; i < this.lengthOfSide; i++) {
      container[i] = [];
      for (let j = 0; j < this.lengthOfSide; j++) {
        container[i][j] = null;
      }
    }
    return container;
  }
  initCardSize() {
    const { cardSize } = this;
    const dom = this.gameContainer.firstElementChild;
    cardSize.columnGap = dom.offsetLeft;
    cardSize.rowGap = dom.offsetTop;
    cardSize.totalWidth = dom.offsetWidth + dom.offsetLeft;
    cardSize.totalHeight = dom.offsetHeight + dom.offsetTop;
  }
  async keyupCallback(event) {
    if (!this.eventHandlers[event.code]) {
      return;
    }
    this.unhandledEvents.push(event.code);
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    let code = this.unhandledEvents.shift();
    while (code) {
      await new Promise(resolve => this.eventHandlers[code](resolve));
      code = this.unhandledEvents.shift();
    }
    this.isClosed = false;
    if (this.isGameOver()) {
      // 游戏结束时，显示遮罩层，并解除事件绑定
      document.getElementById('mask').style.display = 'block';
      document.body.removeEventListener('keyup', this.keyupEventListener);
      if (this.score > this.best) {
        this.best = this.score;
        this.bestDom.innerHTML = this.best;
      }
    }
  }
  // keyupCallback(event) { // 每次只允许处理一个事件
  //   if (this.isClosed || !this.eventHandlers[event.code]) {
  //     return;
  //   }
  //   this.isClosed = true;
  //   new Promise(resolve => this.eventHandlers[event.code](resolve))
  //     .then(() => {
  //       if (this.isGameOver()) {
  //         // 游戏结束时，显示遮罩层，并解除事件绑定
  //         document.getElementById('mask').style.display = 'block';
  //         document.body.removeEventListener('keyup', this.keyupEventListener);
  //         if (this.score > this.best) {
  //           this.best = this.score;
  //           this.bestDom.innerHTML = this.best;
  //         }
  //       }
  //       this.isClosed = false;
  //     });
  // }
  newGame() {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    // 呈现分数板
    if (this.score > this.best) {
      this.best = this.score;
      this.bestDom.innerHTML = this.best;
    }
    this.score = 0;
    this.scoreDom.innerHTML = 0;
    // 隐藏遮罩层，并绑定事件
    document.getElementById('mask').style.display = 'none';
    document.body.addEventListener('keyup', this.keyupEventListener);
    // 清空 container, count, dom
    const promiseArray = [];
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 0; j < this.lengthOfSide; j++) {
        const card = this.container[i][j];
        if (card === null) {
          continue;
        }
        const { dom } = card;
        this.container[i][j] = null;
        const p = new Promise(resolve => this.removeCard(dom, 0, resolve));
        promiseArray.push(p);
      }
    }
    // 随机生成两个 card
    Promise.all(promiseArray)
      .then(() => {
        return Promise.all([
          new Promise(resolve => this.insertRandomCard(resolve)),
          new Promise(resolve => this.insertRandomCard(resolve))
        ]);
      })
      .then(() => this.isClosed = false);
  }
  showData() {
    if (window.localStorage.game2048) {
      const { score, best, container } = JSON.parse(window.localStorage.game2048);
      if (container === null) {
        this.best = best;
        this.bestDom.innerHTML = this.best;
        this.newGame();
        return;
      }
      this.isClosed = true;
      // 呈现分数板
      this.score = score;
      this.best = best;
      this.scoreDom.innerHTML = this.score;
      this.bestDom.innerHTML = this.best;
      // 绑定事件
      document.body.addEventListener('keyup', this.keyupEventListener);
      // 展示数据, 生成 container, count, dom
      const promiseArray = [];
      for (let i = 0; i < this.lengthOfSide; i++) {
        this.container[i] = [];
        for (let j = 0; j < this.lengthOfSide; j++) {
          const value = container[i][j];
          if (value === null) {
            this.container[i][j] = null;
          } else {
            const p = new Promise(resolve => this.insertNewCard(value, i, j, resolve));
            promiseArray.push(p);
          }
        }
      }
      Promise.all(promiseArray)
        .then(() => this.isClosed = false);
    } else {
      this.newGame();
    }
  }
  storeData() {
    const { score, best, count } = this;
    const game2048 = { score, best };
    if ((score === 0 && count === 2) || this.isGameOver()) { // 游戏开始或结束时不存储 container
      game2048.container = null;
    } else {
      game2048.container = [];
      for (let i = 0; i < this.lengthOfSide; i++) {
        game2048.container[i] = [];
        for (let j = 0; j < this.lengthOfSide; j++) {
          const card = this.container[i][j];
          if (card !== null) {
            game2048.container[i][j] = card.value;
          } else {
            game2048.container[i][j] = null;
          }
        }
      }
    }
    window.localStorage.game2048 = JSON.stringify(game2048);
  }
  isGameOver() {
    if (this.count !== this.totalCount) {
      return false;
    }
    const temp = this.container;
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 1; j < this.lengthOfSide; j++) {
        if (
          temp[i][j].value === temp[i][j - 1].value ||
          temp[j][i].value === temp[j - 1][i].value
        ) {
          return false;
        }
      }
    }
    return true;
  }
  moveAllCards(getTo, callback) {
    const to = getTo();
    if (!to.isMove) {
      if (callback) {
        callback();
      }
      return;
    }
    const temp = this.container; // 为避免 container 被覆盖，先保存到 temp 中，并清空 container
    this.container = this.createNullContainer();
    const promiseArray = [];
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 0; j < this.lengthOfSide; j++) {
        const toPosition = to[i][j];
        if (toPosition !== null) {
          const { moveTimeout, moveFrames } = this.animationParams;
          const { rowIndex, colIndex } = toPosition;
          const { dom, value } = temp[i][j];
          this.container[rowIndex][colIndex] = temp[i][j];
          if (toPosition.isMove) { // 需要移动的 card
            const pMove = new Promise(resolve => {
              this.moveCard(
                dom,
                { left: this.getStyleLeft(colIndex), top: this.getStyleTop(rowIndex) },
                moveTimeout,
                moveFrames,
                resolve
              );
            });
            if (toPosition.isMerge) { // 移动且合并的 card
              this.container[rowIndex][colIndex] = null; // 清空 
              const pMoveMerge = pMove
                .then(() => {
                  return new Promise(resolve => this.removeCard(dom, 0, resolve));
                })
                .then(() => {
                  return new Promise(resolve => {
                    this.insertMergedCard(value + value, rowIndex, colIndex, resolve);
                  });
                });
              promiseArray.push(pMoveMerge);
            } else { // 移动但不合并的 card
              promiseArray.push(pMove);
            }
          } else if (toPosition.isMerge) { // 不需要移动但要合并的 card
            this.container[i][j] = null;
            const pNotMove = new Promise(resolve => {
              this.removeCard(dom, moveTimeout, resolve);
            }).then(() => {
              return new Promise(resolve => {
                this.insertMergedCard(value + value, i, j, resolve);
              });
            });
            promiseArray.push(pNotMove);
          }
        }
      }
    }
    Promise.all(promiseArray)
      .then(() => {
        return new Promise(resolve => this.insertRandomCard(resolve));
      })
      .then(() => {
        if (callback) {
          callback();
        }
      });
  }
  moveCard(dom, to, timeout, frames, callback) {
    animationMove(dom, to, timeout, frames, callback);
  }
  removeCard(dom, timeout, callback) { // 移除 dom, 更新 count
    setTimeout(() => {
      dom.remove();
      this.count--;
      if (callback) {
        callback();
      }
    }, timeout);
  }
  insertMergedCard(value, rowIndex, colIndex, callback) { // 插入一个合并后的 card, 更新 count, container 和 dom
    if (this.container[rowIndex][colIndex] !== null) {
      if (callback) {
        callback();
      }
      return;
    }
    const el = this.createCard(value, rowIndex, colIndex);
    this.gameContainer.appendChild(el);
    this.container[rowIndex][colIndex] = new Card(el, value);
    this.score = this.score + value;
    this.scoreDom.innerHTML = this.score;
    this.count++;
    // 添加动画
    const parent = this.gameContainer;
    const scale = { from: 1, to: 1.25 };
    const { top, left, width, height, lineHeight, fontSize } = window.getComputedStyle(el);
    const domParam = removeUnit({ top, left, width, height, lineHeight, fontSize });
    const paramObject = { parent, domParam, scale };
    const { scaleTimeout, scaleFrames } = this.animationParams;
    new Promise(resolve => {
      animationScale(el, paramObject, scaleTimeout, scaleFrames, resolve);
    }).then(() => {
      const temp = scale.from;
      scale.from = scale.to;
      scale.to = temp;
      return new Promise(resolve => {
        animationScale(el, paramObject, scaleTimeout, scaleFrames, resolve);
      });
    }).then(() => {
      this.removeStyleProperty(el, domParam, { top, left });
      if (callback) {
        callback();
      }
    });
  }
  insertRandomCard(callback) { // 随机选择一个空格子中插入一个随机 card, 更新 count, container 和 dom
    if (this.totalCount - this.count < 1) {
      if (callback) {
        callback();
      }
      return;
    }
    let num = randomInteger(1, this.totalCount - this.count);
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 0; j < this.lengthOfSide; j++) {
        if (this.container[i][j] !== null) {
          continue;
        }
        if (num !== 1) {
          num--;
        } else {
          const value = randomValue();
          this.insertNewCard(value, i, j, callback);
          return;
        }
      }
    }
  }
  insertNewCard(value, rowIndex, colIndex, callback) { // 在空格子中插入 card, 更新 count, container 和 dom
    const el = this.createCard(value, rowIndex, colIndex);
    this.container[rowIndex][colIndex] = new Card(el, value);
    this.count++;
    const parent = this.gameContainer;
    const scale = { from: 0, to: 1 };
    // 先将透明元素放入文档中以获取样式，随后再将其移除
    el.style.opacity = 0;
    parent.appendChild(el);
    const { top, left, width, height, lineHeight, fontSize } = window.getComputedStyle(el);
    parent.removeChild(el);
    el.style.removeProperty('opacity');
    const domParam = removeUnit({ top, left, width, height, lineHeight, fontSize });
    const paramObject = { parent, domParam, scale };
    const { scaleTimeout, scaleFrames } = this.animationParams;
    // 将元素放入文档中并添加动画
    animationScale(el, paramObject, scaleTimeout, scaleFrames, () => {
      this.removeStyleProperty(el, domParam, { top, left });
      if (callback) {
        callback();
      }
    });
  }
  createCard(value, rowIndex, colIndex) { // 创建一个 card
    const el = document.createElement('div');
    el.classList.add('game-item', 'game-item-move');
    // 添加背景颜色类
    let pow = Math.round(Math.log(value) / Math.LN2);
    el.classList.add('card-pow-' + pow);
    // 添加字体颜色类
    if (value <= 4) {
      el.classList.add('black');
    } else {
      el.classList.add('white');
    }
    // 添加字体大小类
    pow = Math.ceil(Math.log(value) / Math.LN10);
    if (pow >= 3 && pow <= 6) {
      el.classList.add('card-fontSize-' + pow);
    }
    el.innerHTML = `${value}`;
    el.style.top = this.getStyleTop(rowIndex) + 'px';
    el.style.left = this.getStyleLeft(colIndex) + 'px';
    return el;
  }
  arrowRight(callback) {
    this.moveAllCards(this.getToRight.bind(this), callback);
  }
  arrowUp(callback) {
    this.moveAllCards(this.getToUp.bind(this), callback);
  }
  arrowLeft(callback) {
    this.moveAllCards(this.getToLeft.bind(this), callback);
  }
  arrowDown(callback) {
    this.moveAllCards(this.getToDown.bind(this), callback);
  }
  getToRight() {
    return this.getPositionToRight(this.container);
  }
  getToUp() {
    return this.getTo(
      this.clockwiseQuarterMapping.bind(this),
      this.anticlockwiseQuarterMapping.bind(this)
    );
  }
  getToLeft() {
    return this.getTo(
      this.clockwiseHalfMapping.bind(this),
      this.clockwiseHalfMapping.bind(this)
    );
  }
  getToDown() {
    return this.getTo(
      this.anticlockwiseQuarterMapping.bind(this),
      this.clockwiseQuarterMapping.bind(this)
    );
  }
  getTo(mappingDirectionToRight, inverseMapping) { // 获取沿任一方向移动时，应该到的位置
    let temp = this.rotateMatrix(this.container, mappingDirectionToRight);
    let to = this.getPositionToRight(temp);
    temp = to.isMove;
    to = this.rotateMatrix(to, inverseMapping);
    to.isMove = temp;
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 0; j < this.lengthOfSide; j++) {
        const toPosition = to[i][j];
        if (toPosition !== null) {
          const { rowIndex, colIndex } = inverseMapping(toPosition);
          toPosition.rowIndex = rowIndex;
          toPosition.colIndex = colIndex;
        }
      }
    }
    return to;
  }
  getPositionToRight(container) { // 获取 container 中各元素向右移动时，应该到的位置
    const to = [];
    let isMove = false;
    for (let i = 0; i < this.lengthOfSide; i++) {
      let k = this.lengthOfSide - 1;
      to[i] = [];
      for (let j = 0; j < this.lengthOfSide; j++) {
        to[i][j] = null;
      }
      let current = indexOfLastElement(container[i], this.lengthOfSide - 1);
      while (current !== undefined) {
        const next = indexOfLastElement(container[i], current - 1);
        const isMoveCard = (current === k ? false : true);
        if (!isMove && isMoveCard) {
          isMove = true;
        }
        if (next === undefined) {
          to[i][current] = new ToPosition(i, k, false, isMoveCard);
          break;
        } else {
          if (container[i][current].value !== container[i][next].value) {
            to[i][current] = new ToPosition(i, k, false, isMoveCard);
            current = next;
          } else {
            to[i][current] = new ToPosition(i, k, true, isMoveCard);
            to[i][next] = new ToPosition(i, k, true, true);
            isMove = true;
            current = indexOfLastElement(container[i], next - 1);
          }
        }
        k--;
      }
    }
    to.isMove = isMove;
    return to;
  }
  rotateMatrix(container, mapping) {
    const temp = [];
    for (let i = 0; i < this.lengthOfSide; i++) {
      temp[i] = [];
    }
    for (let i = 0; i < this.lengthOfSide; i++) {
      for (let j = 0; j < this.lengthOfSide; j++) {
        const { rowIndex, colIndex } = mapping({ rowIndex: i, colIndex: j });
        temp[rowIndex][colIndex] = container[i][j];
      }
    }
    return temp;
  }
  clockwiseQuarterMapping({ rowIndex, colIndex }) {
    return {
      rowIndex: colIndex,
      colIndex: this.lengthOfSide - 1 - rowIndex,
    };
  }
  anticlockwiseQuarterMapping({ rowIndex, colIndex }) {
    return {
      rowIndex: this.lengthOfSide - 1 - colIndex,
      colIndex: rowIndex,
    };
  }
  clockwiseHalfMapping({ rowIndex, colIndex }) {
    const position = this.clockwiseQuarterMapping({ rowIndex, colIndex });
    return this.clockwiseQuarterMapping(position);
  }
  removeStyleProperty(dom, totalStyle, keepedStyle) {
    for (let key of Object.keys(totalStyle)) {
      if (!keepedStyle.hasOwnProperty(key)) {
        dom.style.removeProperty(camelToKebab(key));
      }
    }
  }
  getStyleTop(rowIndex) {
    const { rowGap, totalHeight } = this.cardSize;
    return rowGap + totalHeight * rowIndex;
  }
  getStyleLeft(colIndex) {
    const { columnGap, totalWidth } = this.cardSize;
    return columnGap + totalWidth * colIndex;
  }
}

const gg = new Game();
