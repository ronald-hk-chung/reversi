/*
  MVC (Model - View - Controller)
  Model
  -   2 dimensional list ( a grid - contains infomation about what is found at every cell of the game board)
  View
  - initial HTML (gree squares with black borders 8x8)
  Controller
  - click on a cell (if valid cell, flip all surrounded disccs to be current turn color
  Change whose turn it is)
  */

//let blackBackground;
//let discLayer;
let canMoveLayer;
let scoreLable;
let statusLable;
let controlLayer;
let resetButton;
let showCanMoveButton;
let autoPlayButton;
let gap = 3;
let cellWidth = 80;
let turn = 1;
let gameStatus = 0;
let computerPlay = 2;
//let showCanMove = true;
//let aiMethod = 2; //1=random; 2=getMaxDisc; 3=leaveMinMove
let player1Method = 0
let showCanMove1 = true
let player2Method = 2
let showCanMove2 = false

let gameCount = 0;
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


function reversiStart() {
    /*
        setup game environment
        1. blackBackground
        2. discLayer
        3. canMoveLayer
        4. scoreLable  
    */

    $("#scoreLabel").text("Black: 2 White: 2")

    //Set Button
    //resetButton = document.getElementById("resetButton")
    //resetButton.setAttribute("onclick", "reversiReset()");
    $("#resetButton").click(function () { reversiReset() })

    showCanMoveButton = document.getElementById("showCanMoveButton")
    //showCanMoveButton.setAttribute("onclick", "switchCanMove()");
    $("#showCanMoveButton").click(function () { switchCanMove() })

    autoPlayButton = document.getElementById("autoPlayButton")
    //autoPlayButton.setAttribute("onclick", "autoPlay()");
    $("#autoPlayButton").click(function () { autoPlay() });

    simulateFullGameButton = document.getElementById("simulateFullGameButton")
    //simulateFullGameButton.setAttribute("onclick", "simulateFullGame()");
    $("#simulateFullGameButton").click(function () { simulateFullGame() })
    //Drawout
    drawGreenSquares()
    drawDisc(discs)
    drawCanMoveLayer()

}

function reversiReset() {
    /* 
        To reset to initial states 
        reset disc
        set gameover to false
        redraw disc
        redraw canMoveLayer
    */

    discs = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 2, 1, 0, 0, 0],
        [0, 0, 0, 1, 2, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]
    gameOver = false
    turn = 1
    drawDisc()
    drawCanMoveLayer()
    $("#scoreLabel").text("Black: 2 White: 2")
}

function switchCanMove() {
    (showCanMove == true) ? (showCanMove = false) : (showCanMove = true)
    drawCanMoveLayer()
}

function drawGreenSquares() {
    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {

            $(document.createElement("div"))
                .css({
                    "position": "absolute",
                    "background-color": "green",
                    "width": cellWidth,
                    "height": cellWidth,
                    "left": (cellWidth + gap) * column + gap,
                    "top": (cellWidth + gap) * row + gap,
                })
                .attr("onclick", "clickedSquare(" + row + "," + column + ")")
                .appendTo("#blackBackground")
        }
    }
}

function clickedSquare(row, column) {

    let affectedDiscs
    let aiMethod

    if (gameStatus != 0) return
    if (discs[row][column] != 0) return

    if (canClickSpot(turn, row, column, discs) == true) {

        let previousDiscs = structuredClone(discs)

        affectedDiscs = getAffectedDiscs(turn, row, column, discs)
        flipDiscs(affectedDiscs)
        discs[row][column] = turn

        if (turn == 1) turn = 2
        else turn = 1

        if (!canMove(turn, discs)) {

            if (turn == 1) gameStatus = 2
            else gameStatus = 1
        }

        drawCanMoveLayer()
        reDrawScore()
        drawDisc(previousDiscs)

        setTimeout(() => {
            //reDrawStatus()

            //Check if next turn is computer

            if (gameStatus == 0) {

                if (turn == 1 && player1Method != 0) {
                    reversiAI(discs, turn, player1Method)
                } else if (turn == 2 & player2Method != 0) {
                    reversiAI(discs, turn, player2Method)
                }
            }
        },3000)

    }
}


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


function reDrawStatus() {
    if (gameStatus == 0) {
        statusLabel.innerHTML = "Game Over"
    }
}

function reversiAI(currentDisc, id, method) {
    /* 
        Create a new canMoveArray
        choose a random movement from a canMoveArray and return [row and column] in movement
        run ClickSquare (row, column) for next turn
    */
    let chosenMoveIndex
    let chosenRow
    let chosenColumn

    //Build canMoveArray
    canMoveArray = findCanMove(currentDisc, id)

    //randomly choose chosenMove
    if (method == 1) {
        chosenMoveIndex = randomInteger(0, canMoveArray.length - 1)
    }
    if (method == 2) {
        chosenMoveIndex = getMaxDiscs(discs, id, canMoveArray)
    }
    if (method == 3) {
        chosenMoveIndex = leaveMinMove(discs, id, canMoveArray)
    }

    chosenRow = canMoveArray[chosenMoveIndex][0]
    chosenColumn = canMoveArray[chosenMoveIndex][1]

    //run ClickSquare on chosen move
    clickedSquare(chosenRow, chosenColumn)

}

function reversiAISimulate(currentDiscs, id, method) {
    /* 
        Create canMoveArray for id
        Get chosen Move according to method
        run ClickSquare (row, column) for next turn
        return newDisc for next player
    */
    let chosenMoveIndex
    let chosenRow
    let chosenColumn
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

        simulatedDiscs = flipSimulatedDiscs(originalDiscs, canMoveArray[i][0], canMoveArray[i][1], id);
        canMoveArrayTurn = findCanMove(simulatedDiscs, turn);
        if (leaveMove >= canMoveArrayTurn.length) {
            leaveMove = canMoveArrayTurn.length;
            iChosen = i;
        }

    }
    return iChosen;
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

        simulatedDiscs = flipSimulatedDiscs(originalDiscs, canMoveArray[i][0], canMoveArray[i][1], id);
        discCheck = countDisc(simulatedDiscs, id);
        if (discCheck >= idDisc) {
            idDisc = discCheck;
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

    simulatedAffectedDiscs = getAffectedDiscs(id, chosenRow, chosenColumn, originalDiscs);
    for (let i = 0; i < simulatedAffectedDiscs.length; i++) {
        let spot = simulatedAffectedDiscs[i]
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
    clickedSquare(chosenRow, chosenColumn)

}


function findCanMove(currentDisc, id) {
    let canMoveArray = [];
    for (var row = 0; row < 8; row++) {
        for (var column = 0; column < 8; column++) {
            var value = currentDisc[row][column];
            if (value == 0 && canClickSpot(id, row, column, currentDisc)) {
                canMoveArray.push([row, column]);
            }
        }
    }
    return canMoveArray;
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function canMove(id, currentDisc) {
    for (var row = 0; row < 8; row++) {
        for (var column = 0; column < 8; column++) {
            if (canClickSpot(id, row, column, currentDisc)) {
                return true;
            }
        }
    }
    return false;
}

function reDrawScore() {
    var ones = 0;
    var twos = 0;
    for (var row = 0; row < 8; row++) {
        for (var column = 0; column < 8; column++) {
            var value = discs[row][column];
            if (value == 1) ones += 1;
            else if (value == 2) twos += 1;
        }
    }
    scoreLabel.innerHTML = "Black: " + ones + " White: " + twos;
    if ((ones + twos) == 64) {
        gameOver = true;
    }
}


function canClickSpot(id, row, column, currentDisc) {
    /*
        if the number of affected discs by clicking at this spot would be 0
            return false
        else
            return true
    */
    if (currentDisc[row][column] != 0) return false;

    var affectedDiscs = getAffectedDiscs(id, row, column, currentDisc);
    if (affectedDiscs.length == 0) return false;
    else return true;
}

function getAffectedDiscs(id, row, column, currentDisc) {
    /*
        from current spot:
        for all 8 direction (left right, up, down, and 4 diagonals upleft, downleft, upright, downright)
        move along in teh direction until you reach a black or own color
        (keep track of all the opposite color locations along the way)
        if the terminal tile is yoru own color
        add those locations to the list that will be returned
        return the list of affected discs
    */
    var affectedDiscs = [];

    //right
    var couldBeAffected = [];
    var columnIterator = column;
    while (columnIterator < 7) {
        columnIterator += 1;
        var valueAtSpot = currentDisc[row][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
            var discLocation = { row: row, column: columnIterator };
            couldBeAffected.push(discLocation);
        }
    }

    //left
    var couldBeAffected = [];
    var columnIterator = column;
    while (columnIterator > 0) {
        columnIterator -= 1;
        var valueAtSpot = currentDisc[row][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
            var discLocation = { row: row, column: columnIterator };
            couldBeAffected.push(discLocation);
        }
    }

    //up
    var couldBeAffected = [];
    var rowIterator = row;
    while (rowIterator > 0) {
        rowIterator -= 1;
        var valueAtSpot = currentDisc[rowIterator][column];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
            var discLocation = { row: rowIterator, column: column };
            couldBeAffected.push(discLocation);
        }
    }

    //down
    var couldBeAffected = [];
    var rowIterator = row;
    while (rowIterator < 7) {
        rowIterator += 1;
        var valueAtSpot = currentDisc[rowIterator][column];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
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
        var valueAtSpot = currentDisc[rowIterator][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
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
        var valueAtSpot = currentDisc[rowIterator][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
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
        var valueAtSpot = currentDisc[rowIterator][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
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
        var valueAtSpot = currentDisc[rowIterator][columnIterator];
        if (valueAtSpot == 0 || valueAtSpot == id) {
            if (valueAtSpot == id) {
                affectedDiscs = affectedDiscs.concat(couldBeAffected);
            }
            break;
        }
        else {
            var discLocation = { row: rowIterator, column: columnIterator };
            couldBeAffected.push(discLocation);
        }
    }
    return affectedDiscs;
}


function flipDiscs(affectedDiscs) {

    for (var i = 0; i < affectedDiscs.length; i++) {
        var spot = affectedDiscs[i]
        if (discs[spot.row][spot.column] == 1) {
            discs[spot.row][spot.column] = 2;
        }
        else {
            discs[spot.row][spot.column] = 1;
        }
    }

}


function drawDisc(previousDiscs) {

    $("#discLayer").empty()

    for (var row = 0; row < 8; row++) {
        for (var column = 0; column < 8; column++) {
            var value = discs[row][column]
            if (value == 0) {
            } else {

                if (previousDiscs[row][column] == discs[row][column] || previousDiscs[row][column] == 0) {
                    $(document.createElement("div"))
                        .css({
                            "position": "absolute",
                            "width": cellWidth - 2,
                            "height": cellWidth - 2,
                            "border-radius": "50%",
                            "left": (cellWidth + gap) * column + gap,
                            "top": (cellWidth + gap) * row + gap,
                            "z-index": 2,
                            "background-color": (value == 1) ? "black" : "white",
                        })
                        .appendTo("#discLayer")
                } else {
                    $(document.createElement("div"))
                        .css({
                            "position": "absolute",
                            "width": cellWidth - 2,
                            "height": cellWidth - 2,
                            "border-radius": "50%",
                            "left": (cellWidth + gap) * column + gap,
                            "top": (cellWidth + gap) * row + gap,
                            "z-index": 2,
                            "background-color": (value == 1) ? "black" : "white",
                        })
                        .appendTo("#discLayer")
                        .hide()
                        .attr("onclick", "clickedSquare(" + row + "," + column + ")")
                        .fadeIn(1000)

                }
            }
        }
    }
}

function drawCanMoveLayer() {

    $("#canMoveLayer").empty()
    if ((showCanMove1 == true && turn == 1) || (showCanMove2 == true && turn == 2)){
        for (var row = 0; row < 8; row++) {
            for (var column = 0; column < 8; column++) {
                var value = discs[row][column];
                if (value == 0 && canClickSpot(turn, row, column, discs)) {

                    $(document.createElement("div"))
                        .css({
                            "position": "absolute",
                            "width": cellWidth - 2,
                            "height": cellWidth - 2,
                            "border-radius": "50%",
                            "left": (cellWidth + gap) * column + gap,
                            "top": (cellWidth + gap) * row + gap,
                            "z-index": 3,
                            "border": (value == 1) ? "2px solid white" : "2px solid black",
                        })
                        .attr("onclick", "clickedSquare(" + row + "," + column + ")")
                        .appendTo("#canMoveLayer")
                        .hide()
                        .fadeIn(2000)
                    
                }
            }
        }
    }
}

function p1Manual() {

}