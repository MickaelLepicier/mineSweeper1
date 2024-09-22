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

const FLAG = "🚩";
const MINE = "💣";
const BOOM = "💥";
const LIVE = "🩷";
// "🩷💚🤍💛"
const HINT = `<img src="img/hint.png" alt="hint icon">`;

const RESTART = "🙂";
const WON = "😄";
const LOSE = "😱";

// TODOs :
// check in the web about cool minesweeper styles
// start the BONUSES !! :))

/*
 An Idea about adding Yu-Gi-Oh here!
 The player have 5 lives and the mines are Exodia cards
 And if you lose so Exodia is free
*/

function onInit() {
  gLevel = {
    SIZE: 4,
    MINES: 3,
  };

  gGame = {
    isOn: false,
    shownCount: 0,
    minesShownCount: 0,
    markedCount: 0,
    lives: 3,
    hints: 3,
  };

  clearInterval(gTimerInterval);
  gTimerInterval = null;

  gBoard = buildBoard(gLevel.SIZE);
  renderBoard(gBoard);
  renderRestartBtn(RESTART);
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
  // console.log("ss: ");

  // console.table(board);
  for (let i = 0; i < board.length; i++) {
    strHTML += "<tr>";
    for (let j = 0; j < board[0].length; j++) {
      let cell = board[i][j];

      cell.minesAroundCount = setMinesNegsCount(board, { i, j });

      let cellContent = cell.isMarked ? FLAG : "";

      strHTML += `<td class="cell cell-${i}-${j}" onclick="onCellClicked(${i}, ${j})" oncontextmenu="onCellMarked(this,${i}, ${j})" >${cellContent}</td>`;
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

function onCellClicked(i, j) {
  const cell = gBoard[i][j];

  if (!gGame.shownCount) {
    gGame.isOn = true;
    startGame({ i, j });
    startTimer();
  }

  if (cell.isMarked || !gGame.isOn || cell.isShown) return;

  if (cell.isMine && !cell.isShown) {
    gGame.lives--;
    gGame.minesShownCount++;

    renderLives(gGame.lives);
  } else if (cell.minesAroundCount === 0 && !cell.isShown) {
    expandShown(gBoard, i, j);
  }
  gGame.isOn = true;
  if (cell.minesAroundCount && !cell.isMine) gGame.shownCount++;

  cell.isShown = true;

  const cellContent = cell.isMine ? MINE : cell.minesAroundCount;
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
    renderRestartBtn(LOSE);
    gGame.isOn = false;
    revealMines();
    stopTimer();
  } else if (gGame.lives && isAllCellsShown && isAllMinesMarked) {
    console.log("YOU WON");
    renderRestartBtn(WON);
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
        let cellContent = cell.isMarked ? FLAG : board[i][j].minesAroundCount;
        renderCell({ i, j }, cellContent);
        if (cell.minesAroundCount === 0) expandShown(board, i, j);
      }
    }
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

function renderRestartBtn(value) {
  const elBtn = document.querySelector(".restart");

  elBtn.innerText = value;
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
  elHints.innerHTML = hints;
}

function onHintClicked() {
  // let elementToChange = document.getElementsByTagName("body")[0];
  // (elementToChange.style.cursor = url(
  //   "http://wiki-devel.sugarlabs.org/images/e/e2/Arrow.cur"
  // )),
  //   auto;

  // (document.body.style.cursor = cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'  width='40' height='48' viewport='0 0 100 100' style='fill:black;font-size:24px;'><text y='50%'>🍀</text></svg>") 16 0,auto;

  // console.log("document.body.style.cursor: ", document.body.style);

  // console.log("check ");

  const elTable = document.querySelector("table");
  const elHints = document.querySelector(".hints");

  elTable.classList.add("hint");
  elHints.classList.add("hint");
}
