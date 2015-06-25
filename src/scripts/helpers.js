import {keys} from "ramda";
import DeepMerge from "deep-merge";

// HELPERS =========================================================================================
export const merge = DeepMerge((a, b, key) => {
  return b;
});

export function randomArrayItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomObjectKey(obj) {
  return randomArrayItem(keys(obj));
}

export function randomObjectValue(obj) {
  return obj[randomObjectKey(obj)];
}
