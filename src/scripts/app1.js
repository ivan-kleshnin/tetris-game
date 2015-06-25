import {assoc, clone, evolve, map, pipe, reduce, repeat, range, trim} from "ramda";
import Class from "classnames";
import Cycle from "cyclejs";
import {merge} from "./helpers";
import {
  createBoard, createDrawableBoard,
  doesPieceFit, writePiece,
  getFilledRowIndexes, getDropPosition
} from "./board";
import Rx2 from "rx";

let {Rx} = Cycle;
let {Observable} = Rx;

// CONSTANTS =======================================================================================
const BOARD_ROWS = 10; // have to be able to contain PIECES
const BOARD_COLS = 6; // ...
const INITIAL_POSITION = [2, 2]; // TODO evaluate best position (middle of cols, top + 1 of rows?!)

/**
 LEGEND
   "0" - empty cell
   "1" - written cell
   "P" - piece cell
   "G" - ghost cell
*/

const PIECES = {
  I: [[-1,  0], [ 0,  0], [ 1, 0], [2, 0]],
  T: [[ 0, -1], [-1,  0], [ 0, 0], [1, 0]],
  O: [[ 0, -1], [ 1, -1], [ 0, 0], [1, 0]],
  J: [[-1, -1], [-1,  0], [ 0, 0], [1, 0]],
  L: [[ 1, -1], [-1,  0], [ 0, 0], [1, 0]],
  S: [[ 0, -1], [ 1, -1], [-1, 0], [0, 0]],
  Z: [[-1, -1], [ 0, -1], [ 0, 0], [1, 0]],
};

const TICK_MS = 1000;

const DRAW_MAP = {
 "0": "\u2B1C",
 "1": "\u2B1B",
 "P": "\u2B1B",
 "G": "\u2B1B",
};

// APP =============================================================================================
//function Intent(interactions) {
//  return {
//    // TODO: debounce without delay
//    trigger$: interactions.get(".btn.trigger", "click").map(true)
//  }
//}

function Model(/*intentions*/) {
  function seedState() {
    return {
      board: createBoard(BOARD_ROWS, BOARD_COLS),
      piece: PIECES.O,
      position: INITIAL_POSITION,
      over: false,
    };
  }

  // KEYBOARD EVENTS
  let keydown$ = Observable.fromEvent(document, "keydown").debounce(100);
  let hitSpace$ = keydown$.filter(event => event.keyCode == 32);
  let hitLeftArrow$ = keydown$.filter(event => event.keyCode == 37);
  let hitUpArrow$ = keydown$.filter(event => event.keyCode == 38);
  let hitRightArrow$ = keydown$.filter(event => event.keyCode == 39);
  let hitDownArrow$ = keydown$.filter(event => event.keyCode == 40);

  // GAME EVENTS
  let moveLeft$ = hitLeftArrow$.map(() => {
    return function (state) {
      if (!state.over) {
        let [cx, cy] = state.position;
        let newPosition = [cx - 1, cy];
        if (doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    }
  });

  let moveRight$ = hitRightArrow$.map(() => {
    return function (state) {
      if (!state.over) {
        let [cx, cy] = state.position;
        let newPosition = [cx + 1, cy];
        if (doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    }
  });

  let hardDrop$ = hitSpace$.map(() => {
    return function (state) {
      if (!state.over) {
        let dropPosition = getDropPosition(state.board, state.piece, state.position);
        state = assoc("position", dropPosition, state);
      }
      return state;
    }
  });

  let engine$ = Observable.interval(TICK_MS).take(30)
    .map(() => {
      return function (state) {
        if (!state.over) {
          // Gravity
          let [cx, cy] = state.position;
          let newPosition = [cx, cy + 1];
          if (doesPieceFit(state.board, state.piece, newPosition)) {
            state = assoc("position", newPosition, state);
          } else {
            state = merge(state, {
              board: writePiece(state.board, state.piece, state.position),
              piece: PIECES.O,
              position: INITIAL_POSITION
            });
          }

          // Not over?
          let [_, dy] = getDropPosition(state.board, state.piece, state.position);
          //console.log("dy:", dy);
          //console.log("iy:", INITIAL_POSITION[1]);
          if (dy <= INITIAL_POSITION[1]) {
            state = merge(state, {
              over: true,
              piece: undefined,
              position: undefined
            });
          }
        }

        // Collapses
        //let filledRowIndexes = getFilledRowIndexes(state.board);
        //console.log(filledRowIndexes);

        return state;
      }
    });

  let transform$ = Rx.Observable.merge(
    engine$, moveLeft$, moveRight$, hardDrop$
  );

  return {
    state$: transform$
      .scan(seedState(), (state, transform) => transform(state))
      .distinctUntilChanged(),
  };
}

function View(state) {
  function renderRow(row) {
    return row.map(char => {
      return DRAW_MAP[char];
    }).join("");
  }

  function renderBoard(board) {
    return pipe(
      reduce((canvas, row) => canvas + renderRow(row) + "\n", ""),
      trim
    )(board);
  }

  return state.state$.map(state => {
    let {board, piece, position, over} = state;
    let drawableBoard = createDrawableBoard(board, piece, position);
    return (
      <div style={{
        position: "relative",
        width: `${BOARD_COLS * 1.4}em`,
        margin: "auto auto"
      }}>
        <pre><code>
          {renderBoard(drawableBoard)}
        </code></pre>
        {over ? <p>Game over!</p> : undefined}
      </div>
    );
  });
}

//Observable.fromEvent(document, "keydown").subscribe(event => {
//  console.log("keydown:", event);
//});
//
//Rx.DOM.keydown(document).subscribe(event => {
//  console.log("keydown:", event);
//});
//
//Observable.fromEvent(document, "keyup").subscribe(event => {
//  console.log("keyup:", event);
//});
//
//Observable.fromEvent(document, "keypress").subscribe(event => {
//  console.log("keypress:", event);
//});

Cycle.applyToDOM("#main", interactions => View(Model())); // Intent(interactions)
