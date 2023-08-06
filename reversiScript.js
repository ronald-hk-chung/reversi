import { Game, discs } from "./reversiModel.js";
import {
  logIn,
  updateMoveSeq,
  quitGame,
  selectAvatar,
  setAvatar,
  userSubmit,
  showGameRoom,
  showPost,
  postComment,
} from "./reversiMulti.js";

//Set Initial Setup
let gap = 3;
let cellWidth = 80;
let showCanMove = true;
let showAnalysis = false;
let turn = 1;
let moveSeq = [];
let gameStatus = 0;
let allowedTime = 5000;
let player1Method;
let player2Method;
let player1Name = "Black";
let player2Name = "White";
let currentGame;

$(document).ready(function () {
  reversiSetup();
  logIn();
});

function reversiSetup() {
  currentGame = new Game(
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
  //chooseMode
  $("#single").click(function () {
    $("#chooseMode").hide();
    $("#choosePlayer").show();
  });
  $("#double").click(function () {
    $("#chooseMode").hide();
    currentGame.player1Method = 0;
    currentGame.player2Method = 0;
    $("#showAnalysis").hide();
    reversiStart();
  });
  $("#multi").click(function () {
    showGameRoom();
  });
  $("#post").click(function () {
    showPost();
  });

  //choosePlayer
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

  //reset
  $("#quitButton").click(function () {
    quitGame();
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

  //mct
  $("#changeAllowedTime").click(function () {
    changeAllowedTime();
  });

  //gameRoom
  $("#gameRoomClose").click(function () {
    $("#gameRoom").hide();
    quitGame();
  });
  $(".avatar").click(function () {
    selectAvatar(this.id);
  });
  $("#userSubmit").click(function () {
    userSubmit();
  });
  $("#userNameInput").keypress(function (e) {
    if (e.which == 13) {
      $("#userSubmit").click();
    }
  });
  $("#commentInput").emojioneArea({
    pickerPosition: "bottom",
  });

  //navbar
  $("#navGame").hover(
    function () {
      $("#navAction").text("Go to Game");
    },
    function () {
      $("#navAction").text("");
    }
  );
  $("#navComment").hover(
    function () {
      $("#navAction").text("Leave a Comment");
    },
    function () {
      $("#navAction").text("");
    }
  );
  $("#navDoc").hover(
    function () {
      $("#navAction").text("Documentation");
    },
    function () {
      $("#navAction").text("");
    }
  );
  $("#navEmail").hover(
    function () {
      $("#navAction").text("Email Me");
    },
    function () {
      $("#navAction").text("");
    }
  );
  $("#navGame").click(function () {
    $("#main").show();
    $("#commentPage").hide();
    $("#documentation").hide();
  });
  $("#navComment").click(function () {
    quitGame();
    $("#main").hide();
    $("#commentPage").show();
    $("#documentation").hide();
  });
  $("#navDoc").click(function () {
    quitGame();
    $("#main").hide();
    $("#commentPage").hide();
    $("#documentation").show();
  });

  //Comment
  $("#commentSubmit").click(function () {
    postComment();
  });

  //prepare gameboard
  drawBoard();
  setAvatar();
  drawGreenSquares();
  currentGame.initiateMCT();
  currentGame.drawDisc();
  $("#statusLabel").text("Reversi");
  currentGame.drawScore();

  //main
  $("#spinner").hide();
  $("#avatarImg").hide();
  $("#choosePlayer").hide();
  $("#reset").hide();
  $("#mct").hide();
  $("#gameRoom").hide();
  $("#commentPage").hide();
  $("#documentation").hide();

  window.currentGame = currentGame;
}

function reversiReset() {
  currentGame = new Game(
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

  currentGame.initiateMCT();
  currentGame.drawDisc();
  $("#statusLabel").text("Reversi");
  currentGame.drawScore();

  player1Name = "Black";
  player2Name = "White";

  showCanMove = true;
  showAnalysis = false;

  $("#avatarImg").hide();
  $("#canMoveLayer").empty();
  $("#spinner").hide();
  $("#chooseMode").show();
  $("#choosePlayer").hide();
  $("#reset").hide();
  $("#showAnalysis").show();
  $("#mct").hide();
  $("#gameRoom").hide();
  $("#documentation").hide();

  window.currentGame = currentGame;
}

function reversiStart() {
  $("#choosePlayer").hide();
  $("#reset").show();
  $("#quitButton").hide();
  $("#resetButton").show();
  currentGame.drawStatus();
  currentGame.drawCanMoveLayer();
  currentGame.nextTurn();
}

function reversiOnlineStart(name1, avatar1, name2, avatar2, method1, method2) {
  $("#chooseMode").hide();
  $("#choosePlayer").hide();
  $("#reset").show();
  $("#quitButton").show();
  $("#resetButton").hide();
  $("#mct").hide();
  $("#gameRoom").hide();

  currentGame.player1Method = method1;
  currentGame.player2Method = method2;

  player1Name = name1;
  player2Name = name2;

  currentGame.drawStatus();
  currentGame.drawCanMoveLayer();
  currentGame.nextTurn();
  drawAvatar(avatar1, avatar2);
}

function drawAvatar(avatar1, avatar2) {
  $("#player1Avatar").attr("src", "img/" + avatar1 + ".png");
  $("#player2Avatar").attr("src", "img/" + avatar2 + ".png");
  $("#avatarImg").show();
}

function startJoin() {
  currentGame.player1Method = 2;
  currentGame.player2Method = 0;
}

function changeAllowedTime() {
  do {
    allowedTime =
      prompt("Enter MCTS response time in sec", allowedTime / 1000) * 1000;
  } while (!Number.isInteger(allowedTime / 1000) || allowedTime == 0);
}

Game.prototype.clickedSquare = async function (row, column) {
  $("#canMoveLayer").empty();
  this.simulate(row, column);
  if ((this.turn == 1 ? this.player1Method : this.player2Method) == 1)
    this.mcTree = this.filterMCT();
  this.nextTurn();
  this.drawScore();
  this.drawStatus();
  await this.drawDisc();
  await this.drawCanMoveLayer();
};

Game.prototype.nextTurn = async function () {
  let method = this.turn == 1 ? this.player1Method : this.player2Method;
  let methodOpponent = this.turn == 1 ? this.player2Method : this.player1Method;
  let result;

  switch (method) {
    case 0:
      if (methodOpponent == 2) updateMoveSeq(currentGame.moveSeq);
      return;
    case 1:
      let w;
      w = new Worker("reversiMCTS.js", { type: "module" });
      w.postMessage({ allowedTime: allowedTime, gameData: currentGame });
      w.onmessage = function (event) {
        result = event.data.result;
        currentGame.mcTree = event.data.mcTree;
        w.terminate();
        displayResult(result);
        currentGame.clickedSquare(result.row, result.column);
      };
      break;
    case 2:
      updateMoveSeq(currentGame.moveSeq);
      break;
  }
};

Game.prototype.drawStatus = async function () {
  if (this.turn == 1) {
    $("#player1Avatar").show();
    $("#player2Avatar").hide();
  } else {
    $("#player2Avatar").show();
    $("#player1Avatar").hide();
  }
  if (this.gameStatus == 0) {
    (this.turn == 1 && this.player1Method != 0) ||
    (this.turn == 2 && this.player2Method != 0)
      ? $("#spinner").show()
      : $("#spinner").hide();
    $("#statusLabel").text(
      this.turn == 1 ? player1Name + " Turn" : player2Name + " Turn"
    );
  } else if (this.gameStatus == 1) {
    $("#spinner").hide();
    $("#statusLabel").text(player1Name + " Win");
  } else if (this.gameStatus == 2) {
    $("#spinner").hide();
    $("#statusLabel").text(player2Name + " Win");
  } else if (this.gameStatus == 3) {
    $("#spinner").hide();
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
        width: cellWidth - 2,
        height: cellWidth - 2,
        "border-radius": "50%",
        left: (cellWidth + gap) * canMoveArray[i].column + gap + 1,
        top: (cellWidth + gap) * canMoveArray[i].row + gap + 1,
        "z-index": 1,
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
              width: cellWidth - 2,
              height: cellWidth - 2,
              "border-radius": "50%",
              left: (cellWidth + gap) * column + gap + 1,
              top: (cellWidth + gap) * row + gap + 1,
              "z-index": 2,
              "background-image":
                value == 1
                  ? "radial-gradient(#333333 30%, black 70%)"
                  : "radial-gradient(white 30%, #cccccc 70%)",
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
              left: (cellWidth + gap) * column + gap + 1,
              top: (cellWidth + gap) * row + gap + 1,
              "z-index": 2,
              "background-image":
                value == 1
                  ? "radial-gradient(white 30%, #cccccc 70%)"
                  : "radial-gradient(#333333 30%, black 70%)",
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
        "background-image",
        this.moveSeq[this.moveSeq.length - 1].turn == 1
          ? "radial-gradient(#333333 30%, black 70%)"
          : "radial-gradient(white 30%, #cccccc 70%)"
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
    ? $("#showCanMoveButton").text("Hide Move")
    : $("#showCanMoveButton").text("Show Move");

  currentGame.drawCanMoveLayer();
}

function switchShowAnalysis() {
  showAnalysis ? (showAnalysis = false) : (showAnalysis = true);
  showAnalysis ? $("#mct").show() : $("#mct").hide();
  showAnalysis
    ? $("#showAnalysis").text("Hide MCT")
    : $("#showAnalysis").text("Show MCT");
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
  $("#mct").css({
    display: "block",
    position: "relative",
    "margin-left": "auto",
    "margin-right": "auto",
    width: boardWidth,
  });
  $("#comment").css({
    display: "block",
    position: "relative",
    "margin-left": "auto",
    "margin-right": "auto",
    width: boardWidth,
  });
  $("#doc").css({
    display: "block",
    position: "relative",
    "margin-left": "auto",
    "margin-right": "auto",
    width: boardWidth,
  });

  $("#gameRoomContent").width(boardWidth * 0.9);
}

export { reversiReset, reversiOnlineStart };
