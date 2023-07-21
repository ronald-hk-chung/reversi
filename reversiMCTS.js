import { Game, discs } from "./reversiModel";

let gameData;
let simGame;
let result;
onmessage = (event) => {
  gameData = event.data;
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
  result = simGame.mcTreeSearch();
  postMessage({ result: result, mcTree: simGame.mcTree });
};
