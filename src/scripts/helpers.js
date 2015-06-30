import {curry, keys} from "ramda";
import DeepMerge from "deep-merge";

// HELPERS =========================================================================================
// Workaround until https://github.com/ramda/ramda/issues/1073 (wait for release) //////////////////
let doMerge = DeepMerge((a, b, key) => {
  return b;
});

let merge = curry((a, b) => {
  return doMerge(b, a);
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
  merge, assign,
  randomArrayItem, randomObjectKey, randomObjectValue
}
