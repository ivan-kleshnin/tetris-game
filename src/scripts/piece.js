import {curry, map} from "ramda";
import Point from "./point";

// PIECE HANDLERS ==================================================================================
let rotate = function rotate(piece) {
  return map(Point.rotate, piece);
};

export default {
  rotate,
};
