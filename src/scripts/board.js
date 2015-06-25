import {any, clone, concat, contains,
  filter, filterIndexed, find,
  head, map, mapIndexed, max, min,
  pipe, range, reduce, repeat, update
} from "ramda";

// BOARD HANDLERS ==================================================================================
function create(rowNumber, colNumber) {
  let emptyRow = repeat("0", colNumber);
  let emptyBoard = map(() => clone(emptyRow), repeat("0", rowNumber));
  return emptyBoard;
}

function drawPiece(board, piece, position) {
  //let ghostPosition = getDropPosition(board, piece, position);
  //board = writePiece(board, piece, ghostPosition, "G");
  //board = writePiece(board, piece, position, "P");
  if (piece && position) {
    board = writePiece(board, piece, position, "P");
  }
  return board;
}

function writePiece(board, piece, [cx, cy], writeChar="1") {
  return reduce((board, coord) => {
    let [x, y] = coord;
    return update(y + cy, update(x + cx, writeChar, board[y + cy]), board);
  }, board, piece);
}

function doesPieceFit(board, piece, [cx, cy]) {
  return !filter(([x, y]) => (board[y + cy] || {})[x + cx] !== "0", piece).length;
}

function getDropPosition(board, piece, [cx, cy]) {
  let ROWS = board.length;
  let collisionY = find(y => !doesPieceFit(board, piece, [cx, y]), range(cy, ROWS));
  let dropY = collisionY === undefined ? ROWS - 1 : collisionY - 1;
  return [cx, max([cy, dropY])];
}

function getFilledRowIndexes(board) {
  return pipe(
    mapIndexed((row, i) => [i, row]),
    filter(([_, row]) => !any(cell => cell === "0", row)),
    map(head)
  )(board);
}

function collapseFilledRows(board) {
  let COLS = board[0].length;
  let filledRowIndexes = getFilledRowIndexes(board);
  let compensationRows = create(filledRowIndexes.length, COLS);
  return pipe(
    filterIndexed((row, index) => !contains(index, filledRowIndexes)),
    concat(compensationRows)
  )(board);
}

function clearFilledRows(board) {
  let COLS = board[0].length;
  let filledRowIndexes = getFilledRowIndexes(board);
  let placeholderRow = repeat("0", COLS);
  return mapIndexed(
    (row, index) => contains(index, filledRowIndexes) ? clone(placeholderRow) : row,
    board
  );
}

export default {
  create, drawPiece,
  writePiece, doesPieceFit,
  getDropPosition, getFilledRowIndexes,
  collapseFilledRows, clearFilledRows,
};
