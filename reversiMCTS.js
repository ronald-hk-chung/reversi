import { Game, discs } from "./reversiModel.js";

let gameData;
let simGame;
let result;
let allowedTime;
let UCBConstant;
onmessage = (event) => {
  allowedTime = event.data.allowedTime;
  UCBConstant = event.data.UCBConstant;
  gameData = event.data.gameData;
  simGame = new Game(
    gameData.turn,
    gameData.gameStatus,
    gameData.player1Method,
    gameData.player2Method,
    gameData.discs,
    gameData.previousDiscs,
    gameData.moveSeq,
    gameData.mcTree
  );
  result = simGame.mcTreeSearch(allowedTime, UCBConstant);
  postMessage({ result: result, mcTree: simGame.mcTree });
};
