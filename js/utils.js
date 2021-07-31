export function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomValue() {
  return Math.random() < 0.9 ? 2 : 4;
}

export function camelToKebab(string) {
  let array = string.split('');
  array = array.map((char) => {
    const upperChar = char.toUpperCase();
    return char === upperChar ? '-' + char.toLowerCase() : char;
  });
  return array.join('');
}

export function removeUnit(domParam) {
  let obj = {};
  for (let key of Object.keys(domParam)) {
    obj[key] = parseFloat(domParam[key]);
  }
  return obj;
}

export function indexOfLastElement(array, index) {
  for (let i = index; i >= 0; i--) {
    if (array[i]) {
      return i;
    }
  }
  return undefined;
}
