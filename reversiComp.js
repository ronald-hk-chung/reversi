Game.prototype.reversiAI = async function () {
  let method = this.turn == 1 ? this.player1Method : this.player2Method;

  if (method == 0) {
    return;
  } else if (method == 1) {
    chosenMove = await currentGame.randomMove();
  }

  await this.clickedSquare(chosenMove.row, chosenMove.column);
};

Game.prototype.randomMove = async function () {
  let canMoveArray = this.findCanMove();
  return canMoveArray[randomInteger(0, canMoveArray.length - 1)];
};

function simulateFullGame() {
  let method;
  let simulatedDiscs = structuredClone(discs);
  let currentTurn = turn;

  while (!gameOver) {
    if (currentTurn == 1) {
      method = player1Method;
    } else {
      method = player2Method;
    }

    simulatedDiscs = reversiAISimulate(simulatedDiscs, currentTurn, method);

    if (currentTurn == 1) {
      currentTurn = 2;
    } else {
      currentTurn = 1;
    }

    if (canMove(currentTurn, simulatedDiscs) == false) {
      //alert("Game Over");
      gameOver = true;
    }
  }

  discs = structuredClone(simulatedDiscs);
  drawDisc();
  drawCanMoveLayer();
  reDrawScore();
  reDrawStatus();
}

function leaveMinMove(discs, id, canMoveArray) {
  /*
          Simulate All chosen Move to get simulatedDisc
          return the chosenIndex for the simulated move that leave the minimum disc for other play
      */

  let leaveMove = +Infinity;
  let iChosen;
  let canMoveArrayTurn;
  let turn;

  if (id == 1) {
    turn = 2;
  } else {
    turn = 1;
  }

  for (var i = 0; i < canMoveArray.length; i++) {
    let originalDiscs = discs.slice();
    let simulatedDiscs = [];
    let discCheck = 0;
    let canMoveArrayTurn = [];

    simulatedDiscs = flipSimulatedDiscs(
      originalDiscs,
      canMoveArray[i][0],
      canMoveArray[i][1],
      id
    );
    canMoveArrayTurn = findCanMove(simulatedDiscs, turn);
    if (leaveMove >= canMoveArrayTurn.length) {
      leaveMove = canMoveArrayTurn.length;
      iChosen = i;
    }
  }
  return iChosen;
}

function flipSimulatedDiscs(originalDiscs, chosenRow, chosenColumn, id) {
  /*
          for all itmes in the list affectedDiscs
              if the discs at the spot has value 1
                  make it 2
              else
                  make it 1
      */
  let simulatedAffectedDiscs = [];
  let newDiscs = structuredClone(originalDiscs);

  simulatedAffectedDiscs = getAffectedDiscs(
    id,
    chosenRow,
    chosenColumn,
    originalDiscs
  );
  for (let i = 0; i < simulatedAffectedDiscs.length; i++) {
    let spot = simulatedAffectedDiscs[i];
    newDiscs[spot.row][spot.column] = id;
  }
  newDiscs[chosenRow][chosenColumn] = id;
  return newDiscs;
}

function countDisc(discs, id) {
  let discNumber = 0;
  for (var row = 0; row < 8; row++) {
    for (var column = 0; column < 8; column++) {
      if (id == discs[row][column]) {
        discNumber += 1;
      }
    }
  }
  return discNumber;
}

function autoPlay() {
  canMoveArray = findCanMove(discs, turn);
  if (canMoveArray.length == 0) {
    gameOver = true;
    reDrawStatus;
    return;
  }
  chosenMoveIndex = randomInteger(0, canMoveArray.length - 1);
  chosenRow = canMoveArray[chosenMoveIndex][0];
  chosenColumn = canMoveArray[chosenMoveIndex][1];

  //run ClickSquare on chosen move
  clickedSquare(chosenRow, chosenColumn);
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function reversiAISimulate(currentDiscs, id, method) {
  /* 
          Create canMoveArray for id
          Get chosen Move according to method
          run ClickSquare (row, column) for next turn
          return newDisc for next player
      */
  let chosenMoveIndex;
  let chosenRow;
  let chosenColumn;
  let newDiscs = [];

  //Build canMoveArray
  canMoveArray = findCanMove(currentDiscs, id);

  //randomly choose chosenMove
  if (method == 1) {
    chosenMoveIndex = randomInteger(0, canMoveArray.length - 1);
  }
  if (method == 2) {
    chosenMoveIndex = getMaxDiscs(discs, id, canMoveArray);
  }
  if (method == 3) {
    chosenMoveIndex = leaveMinMove(discs, id, canMoveArray);
  }

  chosenRow = canMoveArray[chosenMoveIndex][0];
  chosenColumn = canMoveArray[chosenMoveIndex][1];
  newDiscs = flipSimulatedDiscs(currentDiscs, chosenRow, chosenColumn, id);
  return newDiscs;
}

function getMaxDiscs(discs, id, canMoveArray) {
  /*
          Simulate All chosen Move to get simulatedDisc
          return the chosenIndex for the simulated move that has maximum of Disc with player
      */

  let idDisc = 0;
  let iChosen;
  for (var i = 0; i < canMoveArray.length; i++) {
    let originalDiscs = discs.slice();
    let simulatedDiscs = [];
    let discCheck = 0;

    simulatedDiscs = flipSimulatedDiscs(
      originalDiscs,
      canMoveArray[i][0],
      canMoveArray[i][1],
      id
    );
    discCheck = countDisc(simulatedDiscs, id);
    if (discCheck >= idDisc) {
      idDisc = discCheck;
      iChosen = i;
    }
  }
  return iChosen;
}
