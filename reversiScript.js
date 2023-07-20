import { Game, discs } from "./reversiModel.js";

//Set Initial Setup
let gap = 3;
let cellWidth = 80;
let showCanMove = true;
let showAnalysis = false;
let turn = 1;
let moveSeq = [];
let gameStatus = 0;
let player1Method;
let player2Method;

let currentGame = new Game(
  turn,
  gameStatus,
  player1Method,
  player2Method,
  discs,
  discs,
  moveSeq,
  [
    {
      moveSeq: [],
      turn: 1,
      gameStatus: 0,
      n: 0,
      t: 0,
      nTotal: 0,
      UCB: Infinity,
      parentNode: [],
      nodeIndex: 0,
    },
  ]
);

$(document).ready(function () {
  reversiSetup();
});

function reversiSetup() {
  $("#chooseBlack").click(function () {
    currentGame.player1Method = 0;
    currentGame.player2Method = 1;
    reversiStart();
  });
  $("#chooseWhite").click(function () {
    currentGame.player1Method = 1;
    currentGame.player2Method = 0;
    reversiStart();
  });
  $("#resetButton").click(function () {
    reversiReset();
  });
  $("#showCanMoveButton").click(function () {
    switchCanMove();
  });
  $("#showAnalysis").click(function () {
    switchShowAnalysis();
  });

  drawBoard();
  drawGreenSquares();
  currentGame.initiateMCT();
  currentGame.drawDisc();
  $("#statusLabel").text("Please choose Black/White");
  currentGame.drawScore();
  window.currentGame = currentGame;
}

function reversiStart() {
  $("#choosePlayer").hide();
  $("#playerOption").show();
  currentGame.drawStatus();
  currentGame.drawCanMoveLayer();
  currentGame.nextTurn();
}

Game.prototype.clickedSquare = async function (row, column) {
  $("#canMoveLayer").empty();
  this.simulate(row, column);
  this.mcTree = this.filterMCT();
  if (this.gameStatus == 0) this.nextTurn();
  this.drawScore();
  this.drawStatus();
  await this.drawDisc();
  await this.drawCanMoveLayer();
};

Game.prototype.nextTurn = async function () {
  let method = this.turn == 1 ? this.player1Method : this.player2Method;
  let result;

  switch (method) {
    case 0:
      return;
    case 1:
      let w;
      w = new Worker("./reversiMCTS.js", { type: "module" });
      w.postMessage(currentGame);
      w.onmessage = function (event) {
        result = event.data.result;
        currentGame.mcTree = event.data.mcTree;
        w.terminate();
        displayResult(result);
        currentGame.clickedSquare(result.row, result.column);
      };
      break;
  }
};

Game.prototype.drawStatus = async function () {
  if (this.gameStatus == 0) {
    $("#statusLabel").text(this.turn == 1 ? "Black Turn" : "White Turn");
  } else if (this.gameStatus == 1) {
    $("#statusLabel").text("Black Win");
  } else if (this.gameStatus == 2) {
    $("#statusLabel").text("White Win");
  } else if (this.gameStatus == 3) {
    $("#statusLabel").text("Draw");
  }
  return this.gameStatus;
};

Game.prototype.drawScore = async function () {
  let { blackCount, whiteCount } = this.countScore();
  await $("#scoreLabel").text("Black: " + blackCount + " White: " + whiteCount);
  return { blackCount, whiteCount };
};

Game.prototype.drawCanMoveLayer = async function () {
  $("#canMoveLayer").empty();
  if (this.gameStatus != 0) return;

  let canMoveArray = this.findCanMove();
  for (var i = 0; i < canMoveArray.length; i++) {
    $(document.createElement("div"))
      .addClass("canMove")
      .css({
        position: "absolute",
        width: cellWidth,
        height: cellWidth,
        "border-radius": "50%",
        left: (cellWidth + gap) * canMoveArray[i].column + gap,
        top: (cellWidth + gap) * canMoveArray[i].row + gap,
        "z-index": 3,
      })
      .attr(
        "onclick",
        "clickedSquare(" +
          canMoveArray[i].row +
          "," +
          canMoveArray[i].column +
          ")"
      )
      .appendTo("#canMoveLayer");
  }
  if (
    (this.turn == 1 && this.player1Method != 0) ||
    (this.turn == 2 && this.player2Method != 0)
  ) {
    $(".canMove").removeAttr("onclick");
  }
  if (showCanMove) {
    $(".canMove")
      .css({ border: this.turn == 1 ? "2px solid black" : "2px solid white" })
      .hide();
    $(".canMove").fadeIn(500).promise();
  }
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
              width: cellWidth,
              height: cellWidth,
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
              width: cellWidth,
              height: cellWidth,
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
  await $(".changeDisc").fadeOut(500).promise();
  if (this.moveSeq.length != 0) {
    await $(".changeDisc")
      .css(
        "background-color",
        this.moveSeq[this.moveSeq.length - 1].turn == 1 ? "black" : "white"
      )
      .fadeIn(500)
      .promise();
  }
};

function displayResult(result) {
  $("#resultTable").empty();
  let resultKeys = Object.keys(result.result[0]);

  let headingString = "";
  for (var i = 0; i < resultKeys.length; i++) {
    headingString = headingString + "<th>" + resultKeys[i] + "</th>";
  }
  headingString = "<tr class='w3-grey'>" + headingString + "</tr>";

  let fullDataString = "";

  for (var i = 0; i < result.result.length; i++) {
    let dataString = "";
    for (var item = 0; item < resultKeys.length; item++) {
      dataString =
        dataString + "<td>" + result.result[i][resultKeys[item]] + "</td>";
    }
    if (result.result[i].chosen) {
      dataString = "<tr class='w3-blue'>" + dataString + "</tr>";
    } else {
      dataString = "<tr>" + dataString + "</tr>";
    }
    fullDataString = fullDataString + dataString;
  }
  let htmlString = headingString + fullDataString;
  $("#resultSummary").text(
    "Node Visited: " +
      result.nodeVisited +
      "    Time Calculated: " +
      result.timeCalculated
  );
  $("#resultTable").append(htmlString);
}

function switchCanMove() {
  showCanMove ? (showCanMove = false) : (showCanMove = true);
  showCanMove
    ? $("#showCanMoveButton").text("Hide Allowed Move")
    : $("#showCanMoveButton").text("Show Allowed Move");

  currentGame.drawCanMoveLayer();
}

function switchShowAnalysis() {
  showAnalysis ? (showAnalysis = false) : (showAnalysis = true);
  showAnalysis ? $("#analysis").show() : $("#analysis").hide();
  showAnalysis
    ? $("#showAnalysis").text("Hide MCT Result")
    : $("#showAnalysis").text("Show MCT Result");
}

window.clickedSquare = function (row, column) {
  currentGame.clickedSquare(row, column);
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
        .appendTo("#blackBackground");
    }
  }
}

function drawBoard() {
  let containerWidth = $("#main").width();
  let boardWidth = Math.min(containerWidth, 667);
  cellWidth = (boardWidth - 9 * gap) / 8;
  $("#blackBackground").css({
    display: "block",
    position: "relative",
    "margin-left": "auto",
    "margin-right": "auto",
    "background-color": "black",
    width: boardWidth,
    height: boardWidth,
  });
  $("#analysis").css({
    display: "block",
    position: "relative",
    "margin-left": "auto",
    "margin-right": "auto",
    width: boardWidth,
  });
  $("#playerOption").hide();
  $("#analysis").hide();
}

function reversiReset() {
  location.reload();
}
