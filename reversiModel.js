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
  previousDiscs,
  moveSeq,
  mcTree
) {
  this.turn = turn;
  this.gameStatus = gameStatus;
  this.player1Method = player1Method;
  this.player2Method = player2Method;
  this.discs = structuredClone(discs);
  this.previousDiscs = structuredClone(previousDiscs);
  this.moveSeq = structuredClone(moveSeq);
  this.mcTree = structuredClone(mcTree);
}

Game.prototype.simulate = function (row, column) {
  this.previousDiscs = structuredClone(this.discs);
  this.moveSeq.push({
    row: row,
    column: column,
    turn: this.turn,
    method: 1,
  });
  this.flipDiscs(row, column);
  this.turn = this.turn == 1 ? 2 : 1;

  let score = this.countScore();
  if (!this.canMove() && score.blackCount + score.whiteCount != 64)
    this.turn = this.turn == 1 ? 2 : 1;

  if (!this.canMove()) {
    if (score.blackCount == score.whiteCount) this.gameStatus = 3;
    if (score.blackCount > score.whiteCount) this.gameStatus = 1;
    if (score.blackCount < score.whiteCount) this.gameStatus = 2;
  }

  return this.gameStatus;
};

Game.prototype.cloneGame = function (recordSeq) {
  let newGame = new Game(1, 0, 1, 1, discs, discs, []);
  newGame.reDo(recordSeq);
  return newGame;
};

Game.prototype.reDo = function (recordSeq) {
  for (var i = 0; i < recordSeq.length; i++) {
    this.simulate(recordSeq[i].row, recordSeq[i].column);
  }
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

Game.prototype.flipDiscs = function (selectedRow, selectedColumn) {
  let affectedDiscs = this.getAffectedDiscs(selectedRow, selectedColumn);
  for (let i = 0; i < affectedDiscs.length; i++) {
    var spot = affectedDiscs[i];
    if (this.discs[spot.row][spot.column] == 1) {
      this.discs[spot.row][spot.column] = 2;
    } else {
      this.discs[spot.row][spot.column] = 1;
    }
  }
  this.discs[selectedRow][selectedColumn] = this.turn;
};

Game.prototype.canClickSpot = function (row, column) {
  // $("#canMoveLayer").empty();
  return this.discs[row][column] != 0
    ? false
    : this.getAffectedDiscs(row, column).length == 0
    ? false
    : true;
};

Game.prototype.findCanMove = function () {
  let canMoveArray = [];
  let value;
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      value = this.discs[row][column];
      if (value == 0 && this.canClickSpot(row, column)) {
        canMoveArray.push({ row: row, column: column });
      }
    }
  }
  return canMoveArray;
};

Game.prototype.countScore = function () {
  let blackCount = 0;
  let whiteCount = 0;
  let value;
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      value = this.discs[row][column];
      if (value == 1) blackCount += 1;
      else if (value == 2) whiteCount += 1;
    }
  }
  return { blackCount, whiteCount };
};

Game.prototype.getAffectedDiscs = function (row, column) {
  let affectedDiscs = [];
  let couldBeAffected;
  let columnIterator;
  let rowIterator;
  let valueAtSpot;

  let moveDirection = [
    { columnMove: 1, rowMove: 0 },
    { columnMove: -1, rowMove: 0 },
    { columnMove: 0, rowMove: 1 },
    { columnMove: 0, rowMove: -1 },
    { columnMove: 1, rowMove: 1 },
    { columnMove: 1, rowMove: -1 },
    { columnMove: -1, rowMove: 1 },
    { columnMove: -1, rowMove: -1 },
  ];

  for (let i = 0; i < moveDirection.length; i++) {
    couldBeAffected = [];
    rowIterator = row;
    columnIterator = column;
    while (
      (moveDirection[i].columnMove == 1
        ? columnIterator < 7
        : moveDirection[i].columnMove == -1
        ? columnIterator > 0
        : true) &&
      (moveDirection[i].rowMove == 1
        ? rowIterator < 7
        : moveDirection[i].rowMove == -1
        ? rowIterator > 0
        : true)
    ) {
      rowIterator += moveDirection[i].rowMove;
      columnIterator += moveDirection[i].columnMove;
      valueAtSpot = this.discs[rowIterator][columnIterator];
      if (valueAtSpot == 0 || valueAtSpot == this.turn) {
        if (valueAtSpot == this.turn) {
          affectedDiscs = affectedDiscs.concat(couldBeAffected);
        }
        break;
      } else {
        couldBeAffected.push({ row: rowIterator, column: columnIterator });
      }
    }
  }
  return affectedDiscs;
};

Game.prototype.expandChild = function (maxUCBIndex) {
  let mcTreeExpansion;
  let simGame = this.cloneGame(this.mcTree[maxUCBIndex].moveSeq);
  let canMoveArray = simGame.findCanMove();
  let mcTreeLength = this.mcTree.length;
  for (let i = 0; i < canMoveArray.length; i++) {
    mcTreeExpansion = {
      moveSeq: simGame.moveSeq.concat({
        row: canMoveArray[i].row,
        column: canMoveArray[i].column,
        turn: simGame.turn,
        method: 1,
      }),
      turn: simGame.turn,
      n: 0,
      t: 0,
      nTotal: 0,
      UCB: Infinity,
      parentNode: this.mcTree[maxUCBIndex].parentNode.concat(maxUCBIndex),
      nodeIndex: this.mcTree.length,
    };
    this.mcTree.push(mcTreeExpansion);
  }
  return mcTreeLength + randomInteger(0, canMoveArray.length) - 1;
};

Game.prototype.initiateMCT = function (nodeIndex = 0) {
  let mcTreeExpansion;
  let canMoveArray = this.findCanMove();
  for (let i = 0; i < canMoveArray.length; i++) {
    mcTreeExpansion = {
      moveSeq: this.moveSeq.concat({
        row: canMoveArray[i].row,
        column: canMoveArray[i].column,
        turn: this.turn,
        method: 1,
      }),
      turn: this.turn,
      n: 0,
      t: 0,
      nTotal: 0,
      UCB: Infinity,
      parentNode: [0],
      nodeIndex: this.mcTree.length,
    };
    this.mcTree.push(mcTreeExpansion);
  }
  for (let i = 0; i < canMoveArray.length; i++) {
    this.expandChild(i + 1);
  }
};

Game.prototype.filterMCT = function () {
  let mcTreeNode;
  let mcTreeNew = [];
  let moveSeq = this.moveSeq;
  let rootNode = this.mcTree.findIndex(function (item) {
    return JSON.stringify(item.moveSeq) == JSON.stringify(moveSeq);
  });
  let rootIndex = this.mcTree[rootNode].nodeIndex;
  for (let i = rootNode; i < this.mcTree.length; i++) {
    if (
      this.mcTree[i].parentNode.includes(rootIndex) ||
      this.mcTree[i].nodeIndex == rootIndex
    ) {
      mcTreeNode = {
        moveSeq: currentGame.mcTree[i].moveSeq,
        turn: currentGame.mcTree[i].turn,
        n: currentGame.mcTree[i].n,
        t: currentGame.mcTree[i].t,
        nTotal: currentGame.mcTree[i].nTotal,
        UCB: currentGame.mcTree[i].UCB,
        parentNode:
          currentGame.mcTree[i].nodeIndex == rootNode
            ? []
            : currentGame.mcTree[i].parentNode.map(function (item) {
                return mcTreeNew.findIndex(function (mcNewItem) {
                  return mcNewItem.lastNodeIndex == item;
                });
              }),
        nodeIndex: mcTreeNew.length,
        lastNodeIndex: currentGame.mcTree[i].nodeIndex,
      };
      mcTreeNew.push(mcTreeNode);
    }
  }
  mcTreeNew.forEach(function (obj) {
    delete obj.lastNodeIndex;
  });
  return mcTreeNew;
};

Game.prototype.selectNode = function () {
  let mcTreeSD;
  let maxUCB;
  let maxUCBIndex = 0;
  let focusNode = 0;
  let reachLeaf = false;
  while (!reachLeaf || isFinite(maxUCB)) {
    maxUCB = -Infinity;
    mcTreeSD = this.mcTree.filter(function (item) {
      return item.parentNode[item.parentNode.length - 1] == focusNode;
    });
    if (mcTreeSD.length != 0) {
      for (let i = 0; i < mcTreeSD.length; i++) {
        if (mcTreeSD[i].UCB > maxUCB) {
          maxUCB = mcTreeSD[i].UCB;
          maxUCBIndex = mcTreeSD[i].nodeIndex;
          if (!isFinite(maxUCB)) break;
        }
      }
      focusNode = maxUCBIndex;
    } else {
      reachLeaf = true;
    }
  }
  return maxUCBIndex;
};

Game.prototype.backPropagate = function (maxUCBIndex, UCBConstant, gameStatus) {
  for (let i = 0; i < this.mcTree.length; i++) {
    if (
      this.mcTree[i].nodeIndex == maxUCBIndex ||
      this.mcTree[maxUCBIndex].parentNode.includes(this.mcTree[i].nodeIndex)
    ) {
      this.mcTree[i].n = this.mcTree[i].n + 1;
      this.mcTree[i].t =
        this.mcTree[i].t + (this.mcTree[i].turn == gameStatus ? 1 : -1);
    }
    this.mcTree[i].nTotal = this.mcTree[i].nTotal + 1;
    this.mcTree[i].n == 0
      ? (this.mcTree[i].UCB = Infinity)
      : (this.mcTree[i].UCB =
          this.mcTree[i].t / this.mcTree[i].n +
          Math.sqrt(
            (UCBConstant * Math.log(this.mcTree[0].nTotal + 1)) /
              this.mcTree[i].n
          ));
  }
};

Game.prototype.simulateFull = function () {
  let randomMove;
  while (this.gameStatus == 0) {
    randomMove = this.randomMoveFast();
    this.simulate(randomMove.row, randomMove.column);
  }
};

Game.prototype.randomMoveFast = function () {
  let canMoveArray = this.findCanMove();
  return canMoveArray[randomInteger(0, canMoveArray.length - 1)];
};

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Game.prototype.mcTreeSearch = function (allowedTime, UCBConstant) {
  let mcGame;
  let resultArray;
  let maxUCBIndex;

  let startTime = Date.now();
  while (Date.now() - startTime < allowedTime) {
    //Selection
    maxUCBIndex = this.selectNode();

    //Expansion
    if (isFinite(this.mcTree[maxUCBIndex].UCB))
      maxUCBIndex = this.expandChild(maxUCBIndex);

    //Roll-out
    mcGame = this.cloneGame(this.mcTree[maxUCBIndex].moveSeq);
    mcGame.simulateFull();

    //Backpropagation
    this.backPropagate(maxUCBIndex, UCBConstant, mcGame.gameStatus);
  }

  resultArray = this.mcTree
    .filter(function (item) {
      return item.parentNode[item.parentNode.length - 1] == 0;
    })
    .sort(function (a, b) {
      return b.n - a.n;
    })
    .map(function (item) {
      return {
        row: item.moveSeq[item.moveSeq.length - 1].row,
        column: item.moveSeq[item.moveSeq.length - 1].column,
        n: item.n,
        t: item.t,
        UCB: Math.round(item.UCB * 1000) / 1000,
      };
    });

  return {
    row: resultArray[0].row,
    column: resultArray[0].column,
    result: resultArray,
    nodeVisited: this.mcTree[0].nTotal,
    timeCalculated: Date.now() - startTime,
  };
};

export { Game, discs };
