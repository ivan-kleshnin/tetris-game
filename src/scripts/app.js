import {assoc, clone, evolve, identity, map, pipe, reduce, repeat, range, trim} from "ramda";
import Class from "classnames";
import Cycle from "cyclejs";
import Stream from "cyclejs-stream";
import {merge, randomObjectValue} from "./helpers";
import Piece from "./piece";
import Board from "./board";

let {Rx} = Cycle;
let {Observable, Subject} = Rx;

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

//let randomObjectValue2 = (PIECES) => PIECES.O;

// APP =============================================================================================
function Intent(interactions) {
  // KEYBOARD EVENTS
  let keydown$ = Observable.fromEvent(document, "keydown").debounce(100);
  return {
    // TODO: debounce without delay
    hitEnter$: keydown$.filter(event => event.keyCode == 13),
    hitSpace$: keydown$.filter(event => event.keyCode == 32),
    hitLeftArrow$: keydown$.filter(event => event.keyCode == 37),
    hitUpArrow$: keydown$.filter(event => event.keyCode == 38),
    hitRightArrow$: keydown$.filter(event => event.keyCode == 39),
    hitDownArrow$: keydown$.filter(event => event.keyCode == 40),
  }
}

function Model(intentions) {
  function seedState() {
    return {
      board: Board.create(BOARD_ROWS, BOARD_COLS),
      piece: randomObjectValue(PIECES),
      nextPiece: randomObjectValue(PIECES),
      position: INITIAL_POSITION,
      live: true,
      paused: true,
    };
  }

  // GAME EVENTS
  let moveLeft$ = intentions.hitLeftArrow$.map(() => {
    return function (state) {
      if (state.live && !state.paused) {
        let [cx, cy] = state.position;
        let newPosition = [cx - 1, cy];
        if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    }
  });

  let moveRight$ = intentions.hitRightArrow$.map(() => {
    return function (state) {
      if (state.live && !state.paused) {
        let [cx, cy] = state.position;
        let newPosition = [cx + 1, cy];
        if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    }
  });

  let rotate$ = intentions.hitUpArrow$.map(() => {
    return function (state) {
      if (state.live && !state.paused) {
        let rotatedPiece = Piece.rotateClockwise(state.piece);
        if (Board.doesPieceFit(state.board, rotatedPiece, state.position)) {
          state = assoc("piece", rotatedPiece, state);
        }
      }
      return state;
    }
  });

  let drop$ = intentions.hitSpace$.map(() => {
    return function (state) {
      if (state.live && !state.paused) {
        let dropPosition = Board.getDropPosition(state.board, state.piece, state.position);
        state = merge(state, {
          board: Board.writePiece(state.board, state.piece, dropPosition),
          piece: undefined,
          position: INITIAL_POSITION
        });
      }
      return state;
    }
  });

  let pause$ = intentions.hitEnter$.map(() => {
    return function (state) {
      state = assoc("paused", !state.paused, state);
      return state;
    }
  });

  let tickRunning$ = new Subject();
  tickRunning$.distinctUntilChanged();

  let tick$ = Observable.interval(TICK_MS).pausable(tickRunning$).take(30);

  let gravity$ = tick$.map(() => {
    return function (state) {
      let [cx, cy] = state.position;
      let newPosition = [cx, cy + 1];
      if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
        state = assoc("position", newPosition, state);
      } else {
        state = merge(state, {
          board: Board.writePiece(state.board, state.piece, state.position),
          piece: undefined,
          position: INITIAL_POSITION
        });
      }
      return state;
    }
  });

  let collapse$ = Observable.merge(drop$, gravity$).map(() => {
    return function (state) {
      let filledRowIndexes = Board.getFilledRowIndexes(state.board);
      if (filledRowIndexes.length) {
        let newBoard = Board.collapseFilledRows(state.board);
        state = assoc("board", newBoard, state);
      }
      return state;
    }
  });

  let destiny$ = Observable.merge(drop$, gravity$).map(() => {
    return function (state) {
      if (state.live && !state.paused) {
        if (state.piece == undefined) {
          let nextPiece = randomObjectValue(PIECES);
          if (Board.doesPieceFit(state.board, nextPiece, INITIAL_POSITION)) {
            // Game continues with next piece
            state = merge(state, {
              piece: state.nextPiece,
              nextPiece: randomObjectValue(PIECES),
              position: INITIAL_POSITION
            });
          } else {
            // Game over
            state = merge(state, {
              piece: undefined,
              position: INITIAL_POSITION,
              live: false
            });
          }
        }
      }
      return state;
    }
  });

  let transform$ = Rx.Observable.merge(
    // Controllable
    pause$, moveLeft$, moveRight$, rotate$, drop$,

    // Uncontrollable
    gravity$, collapse$, destiny$
  );

  let state$ = transform$
    .startWith(seedState())
    .scan((state, transform) => transform(state))
    .distinctUntilChanged()
    .shareReplay(1);

  state$.subscribe(state => {
    tickRunning$.onNext(state.live && !state.paused);
  });

  return {state$};
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

  return state.state$.map(({board, piece, nextPiece, position, live, paused}) =>  {
    let primaryBoard = board;
    let secondaryBoard = Board.create(2, 4);
    let primaryBoardWithPiece = Board.drawPiece(primaryBoard, piece, position);
    let secondaryBoardWithPiece = Board.drawPiece(secondaryBoard, nextPiece, [1, 1]);

    let status;
    if (live) {
      if (paused) {
        status = <p>Paused!</p>;
      } else {
        status = <p>Running!</p>;
      }
    } else {
      status = <p>Game over!</p>;
    }
    return (
      <div>
        <div style={{
          float: "left",
        }}>
          <pre>
            <code>
              {renderBoard(primaryBoardWithPiece)}
            </code>
          </pre>
          {status}
        </div>
        <div style={{
          float: "left",
        }}>
          <pre>
            <code>
              {renderBoard(secondaryBoardWithPiece)}
            </code>
          </pre>
        </div>
      </div>
    );
  });
}

Cycle.applyToDOM("#main", interactions => View(Model(Intent(interactions))));
