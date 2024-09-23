"use strict";

// console.log("js working");

// left click open cell , right click put flag (and can't open cell)

// at the end make the game as YU-GI-OH game!

// TODOs:
// make all the nums and mins hidden
// click on cell show whats inside
// first click always without a mine

let gBoard;
/*

cell: {
minesAroundCount: 4,
isShown: false,
isMine: false,
isMarked: true
}

*/

let gLevel;
let gGame;
let gTimer;
let gStartTime;
let gTimerInterval;
// let gBestScore;

const FLAG = "🚩";
const MINE = "💣";
const BOOM = "💥";
const LIVE = "🩷";
// "🩷💚🤍💛"
const HINT = `<img src="img/hint.png" alt="hint icon">`;

const EASY = "👶🏼";
const NORMAL = "🙂";
const HARD = "😎";

const WON = "🤩";
const LOSE = "😱";

// TODOs :
// levels
// BONUS - best score , local storage ( level, time )
//
//

/*
 An Idea about adding Yu-Gi-Oh here!
 The player have 5 lives and the mines are Exodia cards
 And if you lose so Exodia is free
*/

function onInit(level = { s: 4, m: 3, l: "easy" }) {
  // m:4
  gLevel = {
    SIZE: level.s,
    MINES: level.m,
    LEVEL: level.l,
  };

  gGame = {
    isOn: false,
    shownCount: 0,
    minesShownCount: 0,
    markedCount: 0,
    lives: 3,
    hints: 3,
  };

  // gBestScore = {
  //   currScore: null,
  //   bestScore: null,
  // };

  clearInterval(gTimerInterval);
  gTimerInterval = null;
  localStorage.clear();

  gBoard = buildBoard(gLevel.SIZE);
  renderBoard(gBoard);
  renderLevelBtn();
  renderLives(gGame.lives);
  renderHints(gGame.hints);
  renderTimer();
}

function buildBoard(size) {
  let board = [];
  for (let i = 0; i < size; i++) {
    board.push([]);
    for (let j = 0; j < size; j++) {
      board[i][j] = buildCell(board, { i, j });
    }
  }
  return board;
}

function buildCell(board, cellCords) {
  return {
    // id: makeId // TODO do I need it?
    minesAroundCount: 0,
    isShown: false,
    isMine: false,
    isMarked: false,
  };
}

function renderBoard(board) {
  let strHTML = "";

  for (let i = 0; i < board.length; i++) {
    strHTML += "<tr>";
    for (let j = 0; j < board[0].length; j++) {
      let cell = board[i][j];

      cell.minesAroundCount = setMinesNegsCount(board, { i, j });

      let cellContent = cell.isMarked ? FLAG : "";

      strHTML += `<td class="cell cell-${i}-${j}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this,${i}, ${j})" >${cellContent}</td>`;
    }
    strHTML += "</tr>";
  }
  let elBoard = document.querySelector(".board");
  elBoard.innerHTML = strHTML;
}

// Count mines around each cell and set the cell's
function setMinesNegsCount(board, cellCords) {
  const { i, j } = cellCords;

  return countNegMines(board, i, j);
}

function onCellClicked(elCell, i, j) {
  const cell = gBoard[i][j];
  const isHint = elCell.classList.contains("hint");

  if (!gGame.shownCount) {
    gGame.isOn = true;
    startGame({ i, j });
    startTimer();
  }

  if (isHint) {
    console.log("in");
    onHintClicked();
    gGame.hints--;
    renderHints(gGame.hints);

    const expandCellCords = getExpandCellCords(gBoard, i, j);
    console.log("expandCellCords: ", expandCellCords);
    setTimeout(() => unexpandCells(expandCellCords), 1000);
    // updateCell(cell, { i, j });
    return;

    // hintEffect()  or  hintUsed()
  }

  if (cell.isMarked || !gGame.isOn || cell.isShown) return;

  if (cell.isMine && !cell.isShown) {
    gGame.lives--;
    gGame.minesShownCount++;

    renderLives(gGame.lives);
  } else if (cell.minesAroundCount === 0 && !cell.isShown) {
    expandShown(gBoard, i, j);
  }
  updateCell(cell, { i, j });
}

function updateCell(cell, cords) {
  const { i, j } = cords;
  // gGame.isOn = true;
  if (cell.minesAroundCount && !cell.isMine) gGame.shownCount++;

  cell.isShown = true;

  let cellContent = cell.isMine ? MINE : cell.minesAroundCount;
  if (cell.minesAroundCount === 0 && !cell.isMine) cellContent = "";

  renderCell({ i, j }, cellContent);

  checkGameOver();
}

function onCellMarked(elCell, i, j) {
  const cell = gBoard[i][j];
  if (cell.isShown || !gGame.lives || (gGame.shownCount && !gGame.isOn)) return;

  cell.isMarked = !cell.isMarked;

  gGame.markedCount += elCell.innerText ? -1 : 1;

  elCell.innerHTML = cell.isMarked ? FLAG : "";
  checkGameOver();
}

function startGame(cellClickedCords) {
  addMines(cellClickedCords);
  renderBoard(gBoard);
}

function addMines(cellClickedCords) {
  // TODO remove */
  /*
  for (let i = 0; i < gLevel.MINES; i++) {
    let randomCords = getRandomCords();

    if (
      (randomCords.i === cellClickedCords.i &&
        randomCords.j === cellClickedCords.j) ||
      gBoard[randomCords.i][randomCords.j].isMine
    ) {
      i--;
      continue;
    }
    gBoard[randomCords.i][randomCords.j].isMine = true;
  }
  */

  // and delete those lines
  gBoard[2][2].isMine = true;
  gBoard[3][0].isMine = true;
  gBoard[3][2].isMine = true;
}

function checkGameOver() {
  const isAllCellsShown = gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES;
  const totalHiddenMines = gLevel.MINES - gGame.minesShownCount;
  const isAllMinesMarked = gGame.markedCount === totalHiddenMines;

  if (!gGame.lives) {
    console.log("YOU LOSE");
    // renderLevelBtn('win-lose',LOSE);
    document.querySelector(".win-lose").innerHTML = LOSE;
    gGame.isOn = false;
    revealMines();
    stopTimer();
  } else if (gGame.lives && isAllCellsShown && isAllMinesMarked) {
    console.log("YOU WON");
    document.querySelector(".win-lose").innerHTML = WON;
    // renderLevelBtn('win-lose',WON);
    updateBestScore();
    gGame.isOn = false;
    stopTimer();
  }
}

function expandShown(board, cellI, cellJ) {
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue;

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;
      if (i === cellI && j === cellJ) continue;

      const cell = board[i][j];
      if (!cell.isMine && !cell.isShown && !cell.isMarked) {
        cell.isShown = true;
        gGame.shownCount++;
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount;
        if (cell.minesAroundCount === 0) cellContent = "";
        renderCell({ i, j }, cellContent);

        if (cell.minesAroundCount === 0) expandShown(board, i, j);
      }
    }
  }
}

function getExpandCellCords(board, cellI, cellJ) {
  let expandCellCords = [];
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue;

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;

      const cell = board[i][j];
      if (!cell.isMine && !cell.isShown && !cell.isMarked) {
        cell.isShown = true;
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount;
        renderCell({ i, j }, cellContent);

        expandCellCords.push({ i, j });
      }
    }
  }
  return expandCellCords;
}

function unexpandCells(cords) {
  for (let idx = 0; idx < cords.length; idx++) {
    const { i, j } = cords[idx];
    const cell = gBoard[i][j];
    cell.isShown = false;
    let cellContent = cell.isMarked ? FLAG : "";
    renderCell({ i, j }, cellContent);
  }
}

function renderLives(amount) {
  const elLives = document.querySelector(".live");
  let lives = "";
  for (let i = 0; i < amount; i++) {
    lives += LIVE;
  }
  elLives.innerText = lives;
}

// function onKey(ev) {
//   console.log("ev: ", ev);
// }

// function onMouseUp(ev) {
//   console.log("mouse up");
//   console.log("ev: ", ev);
//   return false;
// }

function renderLevelBtn() {
  const elEasyBtn = document.querySelector(`.easy`);
  const elNormalBtn = document.querySelector(`.normal`);
  const elHardBtn = document.querySelector(`.hard`);

  elEasyBtn.innerHTML = EASY;
  elNormalBtn.innerHTML = NORMAL;
  elHardBtn.innerHTML = HARD;
}

function revealMines() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j];

      if (!currCell.isShown && currCell.isMine) {
        //TODO if there is a flag on the mine so we add X on the mine image
        currCell.isShown = true;
        renderCell({ i, j }, MINE);
      }
    }
  }
}

// ~~~~~~~~ TIMER FUNCTIONS ~~~~~~~~

function startTimer() {
  gStartTime = Date.now();
  gTimerInterval = setInterval(updateTimer, 10);
}

function stopTimer() {
  clearInterval(gTimerInterval);
}

function updateTimer() {
  const currTime = Date.now();
  const currMillSec = currTime - gStartTime;

  let minutes = Math.floor((currMillSec / (1000 * 60)) % 60);
  let seconds = Math.floor((currMillSec / 1000) % 60);
  let milliSeconds = Math.floor((currMillSec % 1000) / 10);

  minutes = String(minutes).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  milliSeconds = String(milliSeconds).padStart(2, "0");

  renderTimer(minutes, seconds, milliSeconds);
}

function renderTimer(minutes = "00", seconds = "00", milliSeconds = "00") {
  const elTimer = document.querySelector(".timer");
  elTimer.innerText = `${minutes}:${seconds}:${milliSeconds}`;
}

// ~~~~~~~~ BONUS FUNCTIONS ~~~~~~~~

function renderHints(amount) {
  const elHints = document.querySelector(".hints");
  let hints = "";
  for (let i = 0; i < amount; i++) {
    hints += HINT;
  }
  // elHints.style.cursor = "pointer";
  elHints.innerHTML = hints;
}

function onHintClicked() {
  if (!gGame.isOn) return;
  const elTable = document.querySelector("table");
  const elCells = document.querySelectorAll(".cell");
  const elHints = document.querySelector(".hints");

  for (let i = 0; i < elCells.length; i++) {
    elCells[i].classList.toggle("hint");
  }

  elTable.classList.toggle("hint");
  elHints.classList.toggle("hint");
}

/*
 gLevel = {
    SIZE: level.s,
    MINES: level.m,
    LEVEL: level.l,
  };
*/

// function addScore(){

// }

function updateBestScore() {
  const elTimer = document.querySelector(".timer");
  // {easy , 00:02:90}

  // TODO: update the best score and arrange the renderScore

  const boardSize = gLevel.SIZE;
  const level = gLevel.LEVEL;
  const timer = elTimer.innerText;

  let boardSizeItem = localStorage.getItem("bestScoreSize");
  let levelItem = localStorage.getItem("bestScoreLevel");
  let timerItem = localStorage.getItem("bestScoreTime");

  if (!localStorage.getItem("bestScoreSize")) {
    localStorage.setItem("bestScoreSize", boardSize);
    localStorage.setItem("bestScoreLevel", level);
    localStorage.setItem("bestScoreTime", timer);
  }

  renderBestScore();
}

function renderBestScore() {
  let boardSizeItem = localStorage.getItem("bestScoreSize");
  let levelItem = localStorage.getItem("bestScoreLevel");
  let timerItem = localStorage.getItem("bestScoreTime");

  const elBestScore = document.querySelector(".best-score");
  elBestScore.innerHTML = `You'r best score is:${levelItem} ${timerItem}`;
}
