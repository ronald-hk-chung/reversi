# Monte Carlo Tree Search implimentation on Reversi/Othello
Basic implimentation of Monte Carlo Tree Search (MCTS) on Game Reversi/Othello.

## Table of Content
* [General Info] (#general-info)
* [Technologies] (#technologies)
* [Setup] (#setup)
* [About Monte Carlo Tree Search] (#monte-carlo-tree-search)

<a name="general-info">
## General Info
Single Player Game Reversi/Othello.
Allow user to choose side in teh beginning with the opponents run by basic Monte Carlo Tree Search with no extra game domain knowledge
Response time for opponent is set at 5s with result of MCTS can be shown by Show MCTS

<a name="technologies">
## Technologies
Project is created with
* Javascript
* JQuery
* W3C.CSS

<a name="setup">
## Setup
Program involves 3 files:
reversiScript - Managing the UI of the program with the help of Javascript and JQuery
reversiModel - Contains game model of reversi and the basic implimentation of Monte Carlo Search (details below)
reversiMCTS - simple worker file to run MCTS (Game.mcTreeSearch()) on seperate thread

<a name="monte-carlo-tree-search">
## About Monte Carlo Tree Search
Plenty of excellent resources are on the internet including wikipedia [https://en.wikipedia.org/wiki/Monte_Carlo_tree_search]

For a high-level overview:
MCTS algorigthm iteratively searches a tree structure where each node in the tree represents the game state with an outcome determined by randomly roll-out game. The tree is grown by adding nodes each time the algorithm traverses down the tree and reaches a leaf node where an tree expansion process woudl be used to further traverse down the game-state tree.

Each iteration of the MCTS algorithm goes through the following 4 phases, and the algorithm stops iterating after the number iterations exceeds a user-determined parameter (in this case 5secs) The procedure for one iteration is as follows:
1. Selection
2. Expansion
3. Simulation
4. Backpropagation

Iteration stops once the allowed time lapses. The agent then makes the decision on the prevailing child node based on the maximum number of visits made by MCTS.