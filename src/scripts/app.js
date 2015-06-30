import {assoc, clone, eqDeep, identity, map, pipe, reduce, repeat, range, trim} from "ramda";
import Class from "classnames";
import Cycle from "cyclejs";
import {merge, randomObjectValue} from "./helpers";
import Piece from "./piece";
import Board from "./board";

let {Rx} = Cycle;
let {Observable, Subject} = Rx;

// CONSTANTS =======================================================================================
const BOARD_ROWS = 12; // have to be able to contain PIECES
const BOARD_COLS = 8; // ...
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

const COLLAPSE_FRAMES$ = Observable
  .for(["previous", "cleared", "previous", "cleared", "current"], (v, i) => Observable.return(v).delay(i * 50));

const SCORE_PER_ROW = 100;

//let randomObjectValue = (PIECES) => PIECES.O;

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
      // Game board
      board: Board.create(BOARD_ROWS, BOARD_COLS),

      // Board to collapse
      collapseBoard: undefined,

      // Current piece
      piece: randomObjectValue(PIECES),

      // Next piece
      nextPiece: randomObjectValue(PIECES),

      // Current position (of current piece)
      position: INITIAL_POSITION,

      // Live state (game is not lost)
      live: true,

      // User pause
      paused: true,

      // User scores
      scores: 0,
    };
  }

  function isTicking(state) {
    return state.live && !state.paused;
  }

  // GAME EVENTS
  let moveLeft$ = intentions.hitLeftArrow$.map(() => {
    return function moveLeft(state) {
      if (isTicking(state)) {
        let [cx, cy] = state.position;
        let newPosition = [cx - 1, cy];
        if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    };
  });

  let moveRight$ = intentions.hitRightArrow$.map(() => {
    return function moveRight(state) {
      if (isTicking(state)) {
        let [cx, cy] = state.position;
        let newPosition = [cx + 1, cy];
        if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
          state = assoc("position", newPosition, state);
        }
      }
      return state;
    };
  });

  let rotate$ = intentions.hitUpArrow$.map(() => {
    return function rotate(state) {
      if (isTicking(state)) {
        let rotatedPiece = Piece.rotate(state.piece);
        if (Board.doesPieceFit(state.board, rotatedPiece, state.position)) {
          state = assoc("piece", rotatedPiece, state);
        }
      }
      return state;
    };
  });

  let drop$ = intentions.hitSpace$.map(() => {
    return function drop(state) {
      if (isTicking(state)) {
        let dropPosition = Board.getDropPosition(state.board, state.piece, state.position);
        state = merge({
          board: Board.writePiece(state.board, state.piece, dropPosition),
          piece: undefined,
          position: INITIAL_POSITION
        }, state);
      }
      return state;
    };
  });

  let pause$ = intentions.hitEnter$.map(() => {
    return function pause(state) {
      state = assoc("paused", !state.paused, state);
      return state;
    }
  });

  let ticking$ = new Subject();
  ticking$.distinctUntilChanged();

  let tick$ = Observable.interval(TICK_MS).pausable(ticking$);

  let gravity$ = tick$.map(() => {
    return function gravity(state) {
      let [cx, cy] = state.position;
      let newPosition = [cx, cy + 1];
      if (Board.doesPieceFit(state.board, state.piece, newPosition)) {
        state = assoc("position", newPosition, state);
      } else {
        state = merge({
          board: Board.writePiece(state.board, state.piece, state.position),
          piece: undefined,
          position: INITIAL_POSITION
        }, state);
      }
      return state;
    };
  });

  let maybeCollapse$ = Observable.merge(drop$, gravity$).map(() => {
    return function maybeCollapse(state) {
      let filledRowIndexes = Board.getFilledRowIndexes(state.board);
      if (filledRowIndexes.length) {
        let newBoard = Board.collapseFilledRows(state.board);
        state = merge({
          board: newBoard,
          collapseBoard: state.board,
          scores: state.scores + (SCORE_PER_ROW * filledRowIndexes.length),
        }, state);
      }
      return state;
    };
  });

  let maybeEnd$ = Observable.merge(drop$, gravity$).map(() => {
    return function maybeEnd(state) {
      if (state.live && !state.paused) {
        if (state.piece == undefined) {
          let nextPiece = randomObjectValue(PIECES);
          if (Board.doesPieceFit(state.board, nextPiece, INITIAL_POSITION)) {
            // Game continues with next piece
            state = merge({
              piece: state.nextPiece,
              nextPiece: randomObjectValue(PIECES),
              position: INITIAL_POSITION
            }, state);
          } else {
            // Game over
            state = merge({
              piece: undefined,
              position: INITIAL_POSITION,
              live: false
            }, state);
          }
        }
      }
      return state;
    };
  });

  let cleanup$ = new Subject();

  let transform$ = Rx.Observable.merge(
    // Controlled by a Player
    pause$, moveLeft$, moveRight$, rotate$, drop$,

    // Not controlled by a Player
    gravity$, maybeCollapse$, maybeEnd$, cleanup$
  );

  let state$ = transform$
    .startWith(seedState())
    .scan((state, transform) => transform(state))
    .distinctUntilChanged(identity, eqDeep)
    .shareReplay(1);

  state$.subscribe(state => {
    ticking$.onNext(isTicking(state));
  });

  let collapse$ = state$.filter(state => state.collapseBoard);

  let collapseAnimation$ = collapse$
    .flatMap(() => COLLAPSE_FRAMES$)
    .shareReplay(1);

  let animatedState$ = state$.combineLatest(collapseAnimation$.startWith("current"), (state, animationFrame) => {
    if (state.collapseBoard) {
      if (animationFrame == "previous") {
        return assoc("board", state.collapseBoard, state);
      } else if (animationFrame == "cleared") {
        return assoc("board", Board.clearFilledRows(state.collapseBoard), state);
      } else {
        return state;
      }
    } else {
      return state;
    }
  });

  collapseAnimation$
    .distinctUntilChanged()
    .subscribe(() => {
      ticking$.onNext(false);
  });

  collapseAnimation$
    .filter(animationFrame => animationFrame == "current")
    .subscribe(collapseAnimationEnd => {
      if (collapseAnimationEnd) {
        ticking$.onNext(true);
        cleanup$.onNext(function forgotCollapse(state) {
          return assoc("collapseBoard", undefined, state);
        });
      }
  });

  let visualState$ = animatedState$.map(state => {
    return merge(state, {
      primaryBoard: Board.drawPiece(state.board, state.piece, state.position),
      secondaryBoard: Board.drawPiece(Board.create(2, 4), state.nextPiece, [1, 1]),
    });
  });

  return {
    state$: visualState$
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

  return state.state$.map((state) =>  {
    let status;
    if (state.live) {
      if (state.paused) {
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
              {renderBoard(state.primaryBoard)}
            </code>
          </pre>
          {status}
        </div>
        <div style={{
          float: "left",
        }}>
          <div>
            <pre>
              <code>
                {renderBoard(state.secondaryBoard)}
              </code>
            </pre>
            <div>Scores: {state.scores.toString()}</div>
          </div>
        </div>
      </div>
    );
  });
}

Cycle.applyToDOM("#main", interactions => View(Model(Intent(interactions))));
