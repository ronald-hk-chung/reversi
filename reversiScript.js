"use strict";

//Set Initial Setup
let gameCount = 0;
let gap = 3;
let cellWidth = 80;
let turn = 1;
let gameStatus = 0;
let showCanMove = true;
let player1Method = 0; //let aiMethod = 2; //1=random; 2=getMaxDisc; 3=leaveMinMove
let player2Method = 1;
let discs = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 1, 0, 0, 0],
  [0, 0, 0, 1, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function Game(
  turn,
  gameStatus,
  player1Method,
  player2Method,
  discs,
  previousDiscs
) {
  this.turn = turn;
  this.gameStatus = gameStatus;
  this.player1Method = player1Method;
  this.player2Method = player2Method;
  this.discs = structuredClone(discs);
  this.previousDiscs = structuredClone(previousDiscs);
}

let currentGame = new Game(
  turn,
  gameStatus,
  player1Method,
  player2Method,
  discs,
  discs
);

async function reversiStart() {
  $("#scoreLabel").text("Black: 2 White: 2");

  $("#resetButton").click(function () {
    currentGame.reversiReset();
  });

  $("#showCanMoveButton").click(function () {
    switchCanMove();
  });

  // $("#autoPlayButton").click(function () {
  //   autoPlay();
  // });

  // $("#simulateFullGameButton").click(function () {
  //   simulateFullGame();
  // });

  drawGreenSquares();
  currentGame.drawDisc();
  currentGame.drawCanMoveLayer();
}

Game.prototype.canClickSpot = function (row, column) {
  return this.discs[row][column] != 0
    ? false
    : this.getAffectedDiscs(row, column).length == 0
    ? false
    : true;
};

Game.prototype.reversiReset = function () {
  currentGame = new Game(
    turn,
    gameStatus,
    player1Method,
    player2Method,
    discs,
    discs
  );

  $("#scoreLabel").text("Black: 2 White: 2");

  currentGame.drawDisc();
  currentGame.drawCanMoveLayer();
};

Game.prototype.simulate = function (row, column) {
  if (this.gameStatus != 0) return;
  if (this.discs[row][column] != 0) return;

  if (this.canClickSpot(row, column) == true) {
    this.previousDiscs = structuredClone(this.discs);
    this.flipDiscs(row, column);
    this.turn = this.turn == 1 ? 2 : 1;
  }
  if (!this.canMove()) gameStatus = turn == 1 ? 2 : 1;
};

Game.prototype.clickedSquare = async function (row, column) {
  this.simulate(row, column);
  this.reDrawScore();
  await this.drawDisc();
  await this.drawCanMoveLayer();
  await this.reversiAI();
};

function reDrawStatus() {
  if (gameStatus == 0) {
    $("statusLabel").text("Game Over");
  }
}

Game.prototype.getAffectedDiscs = function (row, column) {
  /*
    from current spot:
    for all 8 direction (left right, up, down, and 4 diagonals upleft, downleft, upright, downright)
    move along in teh direction until you reach a black or own color
    (keep track of all the opposite color locations along the way)
    if the terminal tile is yoru own color
    add those locations to the list that will be returned
    return the list of affected discs
  */
  let affectedDiscs = [];

  //right
  var couldBeAffected = [];
  var columnIterator = column;
  while (columnIterator < 7) {
    columnIterator += 1;
    var valueAtSpot = this.discs[row][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: row, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }

  //left
  var couldBeAffected = [];
  var columnIterator = column;
  while (columnIterator > 0) {
    columnIterator -= 1;
    var valueAtSpot = this.discs[row][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: row, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }

  //up
  var couldBeAffected = [];
  var rowIterator = row;
  while (rowIterator > 0) {
    rowIterator -= 1;
    var valueAtSpot = this.discs[rowIterator][column];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: column };
      couldBeAffected.push(discLocation);
    }
  }

  //down
  var couldBeAffected = [];
  var rowIterator = row;
  while (rowIterator < 7) {
    rowIterator += 1;
    var valueAtSpot = this.discs[rowIterator][column];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: column };
      couldBeAffected.push(discLocation);
    }
  }

  //upright
  var couldBeAffected = [];
  var rowIterator = row;
  var columnIterator = column;
  while (rowIterator > 0 && columnIterator < 7) {
    rowIterator -= 1;
    columnIterator += 1;
    var valueAtSpot = this.discs[rowIterator][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }

  //downright
  var couldBeAffected = [];
  var rowIterator = row;
  var columnIterator = column;
  while (rowIterator < 7 && columnIterator < 7) {
    rowIterator += 1;
    columnIterator += 1;
    var valueAtSpot = this.discs[rowIterator][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }

  //upleft
  var couldBeAffected = [];
  var rowIterator = row;
  var columnIterator = column;
  while (rowIterator > 0 && columnIterator > 0) {
    rowIterator -= 1;
    columnIterator -= 1;
    var valueAtSpot = this.discs[rowIterator][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }

  //downleft
  var couldBeAffected = [];
  var rowIterator = row;
  var columnIterator = column;
  while (rowIterator < 7 && columnIterator > 0) {
    rowIterator += 1;
    columnIterator -= 1;
    var valueAtSpot = this.discs[rowIterator][columnIterator];
    if (valueAtSpot == 0 || valueAtSpot == this.turn) {
      if (valueAtSpot == this.turn) {
        affectedDiscs = affectedDiscs.concat(couldBeAffected);
      }
      break;
    } else {
      var discLocation = { row: rowIterator, column: columnIterator };
      couldBeAffected.push(discLocation);
    }
  }
  return affectedDiscs;
};

Game.prototype.canMove = function () {
  for (var row = 0; row < 8; row++) {
    for (var column = 0; column < 8; column++) {
      if (this.canClickSpot(row, column)) {
        return true;
      }
    }
  }
  return false;
};

Game.prototype.findCanMove = function () {
  let canMoveArray = [];
  for (var row = 0; row < 8; row++) {
    for (var column = 0; column < 8; column++) {
      var value = this.discs[row][column];
      if (value == 0 && this.canClickSpot(row, column)) {
        canMoveArray.push({ row: row, column: column });
      }
    }
  }
  return canMoveArray;
};

Game.prototype.reDrawScore = function () {
  let { ones, twos } = this.countScore();
  $("#scoreLabel").text("Black: " + ones + " White: " + twos);
};

Game.prototype.countScore = function () {
  var ones = 0;
  var twos = 0;
  for (var row = 0; row < 8; row++) {
    for (var column = 0; column < 8; column++) {
      var value = this.discs[row][column];
      if (value == 1) ones += 1;
      else if (value == 2) twos += 1;
    }
  }
  return { ones, twos };
};

Game.prototype.flipDiscs = function (selectedRow, selectedColumn) {
  let affectedDiscs = this.getAffectedDiscs(selectedRow, selectedColumn);
  for (var i = 0; i < affectedDiscs.length; i++) {
    var spot = affectedDiscs[i];
    if (this.discs[spot.row][spot.column] == 1) {
      this.discs[spot.row][spot.column] = 2;
    } else {
      this.discs[spot.row][spot.column] = 1;
    }
  }
  this.discs[selectedRow][selectedColumn] = this.turn;
};

Game.prototype.drawCanMoveLayer = async function () {
  $("#canMoveLayer").empty();
  if (showCanMove) {
    if (this.gameStatus != 0) return;
    if (this.turn == 1 && this.player1Method != 0) return;
    if (this.turn == 2 && this.player2Method != 0) return;

    let canMoveArray = this.findCanMove();
    for (var i = 0; i < canMoveArray.length; i++) {
      $(document.createElement("div"))
        .addClass("canMove")
        .css({
          position: "absolute",
          width: cellWidth - 2,
          height: cellWidth - 2,
          "border-radius": "50%",
          left: (cellWidth + gap) * canMoveArray[i].column + gap,
          top: (cellWidth + gap) * canMoveArray[i].row + gap,
          "z-index": 3,
          border: this.turn == 1 ? "2px solid black" : "2px solid white",
        })
        .attr(
          "onclick",
          "currentGame.clickedSquare(" +
            canMoveArray[i].row +
            "," +
            canMoveArray[i].column +
            ")"
        )
        .appendTo("#canMoveLayer")
        .hide();
    }
  }
  $(".canMove").fadeIn(2000).promise();
};

Game.prototype.drawDisc = async function () {
  $("#discLayer").empty();

  for (var row = 0; row < 8; row++) {
    for (var column = 0; column < 8; column++) {
      var value = this.discs[row][column];
      if (value == 0) {
      } else {
        if (
          this.previousDiscs[row][column] == this.discs[row][column] ||
          this.previousDiscs[row][column] == 0
        ) {
          $(document.createElement("div"))
            .css({
              position: "absolute",
              width: cellWidth - 2,
              height: cellWidth - 2,
              "border-radius": "50%",
              left: (cellWidth + gap) * column + gap,
              top: (cellWidth + gap) * row + gap,
              "z-index": 2,
              "background-color": value == 1 ? "black" : "white",
            })
            .appendTo("#discLayer");
        } else {
          $(document.createElement("div"))
            .addClass("changeDisc")
            .css({
              position: "absolute",
              width: cellWidth - 2,
              height: cellWidth - 2,
              "border-radius": "50%",
              left: (cellWidth + gap) * column + gap,
              top: (cellWidth + gap) * row + gap,
              "z-index": 2,
              "background-color": value == 1 ? "white" : "black",
            })
            .appendTo("#discLayer");
        }
      }
    }
  }
  await $(".changeDisc").fadeOut(1000).promise();

  await $(".changeDisc")
    .css("background-color", this.turn == 1 ? "white" : "black")
    .fadeIn(1000)
    .promise();
};

function drawGreenSquares() {
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      $(document.createElement("div"))
        .css({
          position: "absolute",
          "background-color": "green",
          width: cellWidth,
          height: cellWidth,
          left: (cellWidth + gap) * column + gap,
          top: (cellWidth + gap) * row + gap,
        })
        .attr(
          "onclick",
          "currentGame.clickedSquare(" + row + "," + column + ")"
        )
        .appendTo("#blackBackground");
    }
  }
}
