import {evolve, map, repeat, range, clone} from "ramda";

const ROWS = 20; // was 20;
const COLS = 10;

const EMPTY_ROW = repeat("0", COLS);
const EMPTY_BOARD = map(() => clone(EMPTY_ROW), repeat("0", ROWS));

// "0" - empty cell
// "1" - written cell
// "P" - piece cell
// "G" - ghost cell

const PIECES = {
  I: [[-1,  0], [ 0,  0], [ 1, 0], [2, 0]],
  T: [[ 0, -1], [-1,  0], [ 0, 0], [1, 0]],
  O: [[ 0, -1], [ 1, -1], [ 0, 0], [1, 0]],
  J: [[-1, -1], [-1,  0], [ 0, 0], [1, 0]],
  L: [[ 1, -1], [-1,  0], [ 0, 0], [1, 0]],
  S: [[ 0, -1], [ 1, -1], [-1, 0], [0, 0]],
  Z: [[-1, -1], [ 0, -1], [ 0, 0], [1, 0]],
};

let gameState = {
  board: EMPTY_BOARD,
  piece: PIECES.O,
  position: [0, 0],
};

//let step0 = gameState;
//let step1 = evolve({position: moveLeft}, step0);
//let step2 = evolve({position: moveDown}, step1);
//let step3 = evolve({position: moveDown}, step2);
//let step4 = evolve({piece: rotate90}, step3);
//let step5 = evolve({position: moveRight}, step4);
//gameState = evolve({piece: rotate90}, gameState);
//gameState.board = writePiece(gameState.board, gameState.piece, gameState.position);
//gameState.board[0][0] = 1;
//console.log("1)", gameState);
//console.log("2)", writePiece(gameState.board, gameState.piece, gameState.position));
//console.log("3)", gameState);

function tryMoveLeft() {
  let {board, piece, position} = gameState;
  let newPosition = moveLeft(position);
  if (doesPieceFit(board, piece, newPosition)) {
    gameState.position = newPosition;
  }
}

function tryMoveRight() {
  let {board, piece, position} = gameState;
  let newPosition = moveRight(position);
  if (doesPieceFit(board, piece, newPosition)) {
    gameState.position = newPosition;
  }
}

function tryRotate() {
  let {board, piece, position} = gameState;
  let newPiece = rotatePiece(true, piece);
  if (doesPieceFit(board, newPiece, position)) {
    gameState.piece = newPiece;
  }
}

function hardDrop() {
  let {board, piece, position} = gameState;
  let dropPosition = getDropPosition(board, piece, position);
  gameState.board = writePiece(board, piece, dropPosition);
  gameState.position = dropPosition;
}



//gameState.board[17][4] = 2;
//console.log("Board:", gameState.board);
//console.log("Piece:", gameState.piece);
//console.log("Position before drop:", gameState.position);
//let dropPos = getDropPos(gameState.board, gameState.piece, gameState.position);
//console.log("Position after drop:", dropPos);
//gameState.board = writePiece(gameState.board, gameState.piece, dropPos);


