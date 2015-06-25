import Moment from "moment";
import {expect} from "chai";
import Board from "../src/scripts/board";

// SPECS ===========================================================================================
describe("collapseFilledRows()", function () {
  it("should collapse filled rows", function () {
    // [0 P 0]    [0 0 0]
    // [1 1 1] => [0 P 0]
    // [Z 0 0]    [Z 0 0]
    let board = Board.create(3, 3);
    board[0][1] = "P";
    board[1][0] = "1";
    board[1][1] = "1";
    board[1][2] = "1";
    board[2][0] = "Z";
    let expectedBoard = Board.create(3, 3);
    expectedBoard[1][1] = "P";
    expectedBoard[2][0] = "Z";
    expect(Board.collapseFilledRows(board)).eql(expectedBoard);
  });
});

describe("clearFilledRows()", function () {
  it("should clear filled rows", function () {
    // [0 P 0]    [0 P 0]
    // [1 1 1] => [0 0 0]
    // [Z 0 0]    [Z 0 0]
    let board = Board.create(3, 3);
    board[0][1] = "P";
    board[1][0] = "1";
    board[1][1] = "1";
    board[1][2] = "1";
    board[2][0] = "Z";
    let expectedBoard = Board.create(3, 3);
    expectedBoard[0][1] = "P";
    expectedBoard[2][0] = "Z";
    expect(Board.clearFilledRows(board)).eql(expectedBoard);
  });
});
