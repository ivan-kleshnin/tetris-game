import {curry} from "ramda";

// POINT HANDLERS ==================================================================================
let rotate = function rotate([x, y]) {
  return [-y, x];
};

function moveLeft([x, y]) {
  return [dec(x), y];
}

function moveRight([x, y]) {
  return [inc(x), y];
}

function moveDown([x, y]) {
  return [x, inc(y)];
}

export default {
  rotate, moveLeft, moveRight, moveDown,
};
