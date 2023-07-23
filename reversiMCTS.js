import { Game, discs } from "./reversiModel.js";

let gameData;
let simGame;
let result;
let allowedTime;
onmessage = (event) => {
  allowedTime = event.data.allowedTime;
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
  result = simGame.mcTreeSearch(allowedTime);
  postMessage({ result: result, mcTree: simGame.mcTree });
};
