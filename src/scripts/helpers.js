import {curry, keys} from "ramda";
import deepExtend from "deep-extend";

// HELPERS =========================================================================================
let merge = curry((a, b) => {
  return deepExtend(b, a);
});

let assign = curry((a, b) => {
  return Object.assign({}, b, a);
});

function randomArrayItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomObjectKey(obj) {
  return randomArrayItem(keys(obj));
}

function randomObjectValue(obj) {
  return obj[randomObjectKey(obj)];
}

export default {
  merge,
  randomArrayItem, randomObjectKey, randomObjectValue
}
