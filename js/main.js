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
// let gTimer;
let gStartTime;
let gTimerInterval;
let gManualMinesLocations;

const FLAG = "🚩";
const MINE = "💣";
const BOOM = "💥";
const LIVE = "🩷";
// "🩷💚🤍💛"
const HINT = `<img src="img/hint.png" alt="hint icon">`;
// const SAFE = "";

const EASY = "👶🏼";
const NORMAL = "🙂";
const HARD = "😎";

const WON = "🤩";
const LOSE = "😱";

// TODOs :
// levels
// BONUS - manual mode
//
//

/*
 An Idea about adding Lego here!
 
*/

function onInit(
  level = { s: 4, m: 3, l: "Easy" },
  clearStorage = true,
  onManual = false
) {
  // m:4
  gLevel = {
    SIZE: level.s,
    MINES: level.m,
    LEVEL: level.l,
  };

  gGame = {
    isOn: false,
    shownCount: -1,
    minesShownCount: 0,
    markedCount: 0,
    lives: 3,
    hints: 3,
    safe: 3,
    isManual: onManual,
    // x: false,
  };

  console.log("gGame.isManual: ", gGame.isManual);

  if (!onManual) gManualMinesLocations = [];

  // console.log("gManualMinesLocations: ", gManualMinesLocations);

  clearInterval(gTimerInterval);
  gTimerInterval = null;
  if (clearStorage) localStorage.clear();

  gBoard = buildBoard(gLevel.SIZE);
  // render() = render all the functions
  renderBoard(gBoard);
  renderLevelBtn();
  renderLives(gGame.lives);
  renderHints(gGame.hints);
  renderTimer();
  renderBestScore();
  renderSafe();

  document.querySelector(".win-lose").innerHTML = "";
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

  if (gGame.isManual) {
    if (elCell.innerHTML === MINE) return;
    gManualMinesLocations.push({ i, j });
    renderCell({ i, j }, MINE);

    return;
  }

  if (gGame.shownCount === -1) {
    gGame.shownCount++;
    startGame({ i, j });
  }

  if (isHint) {
    onHintClicked();
    gGame.hints--;
    renderHints(gGame.hints);

    const expandCellCords = getExpandCellCords(gBoard, i, j);
    console.log("expandCellCords: ", expandCellCords);
    setTimeout(() => unexpandCells(expandCellCords), 1000);
    // updateCell(cell, { i, j });
    return;
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
  gGame.isOn = true;
  addMines(cellClickedCords, gGame.isManual);
  renderBoard(gBoard);
  startTimer();
}

function addMines(cellClickedCords, isManual = false) {
  if (isManual) {
    addManualMines();
    return;
  }

  // TODO remove */

  // maybe put a function - addRandomMines()
  for (let i = 0; i < gLevel.MINES; i++) {
    let randomCords = getRandomCords();
    // make this code shorter with: const {i,j} = randomCords
    // and with: const {i,j} = cellClickedCords

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

  // and delete those lines
  // gBoard[2][2].isMine = true;
  // gBoard[3][0].isMine = true;
  // gBoard[3][2].isMine = true;
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
    bestScore();
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
  gTimerInterval = setInterval(updateTimer, 60);
}

function stopTimer() {
  clearInterval(gTimerInterval);
}

function updateTimer() {
  const currTime = Date.now();
  const currMillSec = currTime - gStartTime;

  let minutes = Math.floor((currMillSec / (1000 * 60)) % 60);
  let seconds = Math.floor((currMillSec / 1000) % 60);
  // let milliSeconds = Math.floor((currMillSec % 1000) / 10);

  minutes = String(minutes).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  // milliSeconds = String(milliSeconds).padStart(2, "0");

  renderTimer(minutes, seconds);
}

function renderTimer(minutes = "00", seconds = "00") {
  const elTimer = document.querySelector(".timer");
  elTimer.innerText = `${minutes}:${seconds}`;
}

// ~~~~~~~~ BONUS FUNCTIONS ~~~~~~~~

function renderHints(amount) {
  const elHints = document.querySelector(".hints");
  let hints = "";
  for (let i = 0; i < amount; i++) {
    hints += HINT;
  }
  elHints.style.cursor = "pointer";
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

function getExpandCellCords(board, cellI, cellJ) {
  let expandCellCords = [];
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue;

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;

      const cell = board[i][j];
      if (!cell.isShown && !cell.isMarked) {
        cell.isShown = true;
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount;
        if (cell.minesAroundCount === 0) cellContent = "";
        if (cell.isMine) cellContent = MINE;

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
    renderCell({ i, j }, cellContent, false);
  }
}

function bestScore() {
  const elTimer = document.querySelector(".timer");

  const currBoardSize = gLevel.SIZE;
  const currLevel = gLevel.LEVEL;
  const currTimer = elTimer.innerText;

  const boardSizeItem = localStorage.getItem("bestScoreSize");

  if (!boardSizeItem) {
    addItems(currBoardSize, currLevel, currTimer);
    renderBestScore();
    return;
  }

  const timerItem = localStorage.getItem("bestScoreTime");

  const bestTime = getTimeObj(timerItem);

  const currTime = getTimeObj(currTimer);

  if (currBoardSize >= boardSizeItem) {
    // check if the level is higher by the board size
    if (currBoardSize > boardSizeItem) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;
      // check if the best score minutes are smaller then the current minutes
    } else if (bestTime.minutes < currTime.minutes) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;
      // check if the best score seconds are higher then the current seconds
    } else if (
      bestTime.minutes === currTime.minutes &&
      bestTime.seconds >= currTime.seconds
    ) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;
    }
    renderBestScore();
  }
}

function updateBestScore(currBoardSize, currLevel, currTimer) {
  addItems(currBoardSize, currLevel, currTimer);
  renderBestScore();
}

function renderBestScore() {
  let levelItem = localStorage.getItem("bestScoreLevel");
  let timerItem = localStorage.getItem("bestScoreTime");
  if (!levelItem && !timerItem) return;

  const elBestScore = document.querySelector(".best-score span");
  elBestScore.innerHTML = `${levelItem} - ${timerItem}`;
}

function addItems(currBoardSize, currLevel, currTimer) {
  localStorage.setItem("bestScoreSize", currBoardSize);
  localStorage.setItem("bestScoreLevel", currLevel);
  localStorage.setItem("bestScoreTime", currTimer);
}

function getTimeObj(str) {
  const splitTime = str.split(":");
  const timeObj = { minutes: +splitTime[0], seconds: +splitTime[1] };

  return timeObj;
}

function onSafeClick() {
  if (!gGame.isOn || !gGame.safe) return;

  const emptyCells = getTargetedCells(false);
  const randomIdx = getRandomInt(0, emptyCells.length - 1);
  // const randomCell = renderCell()
  // const { i, j } = emptyCells[randomIdx];

  gGame.safe--;
  renderSafe(emptyCells[randomIdx]);
}

function getTargetedCells(isMine) {
  let targetedCells = [];
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j];
      const target = isMine ? cell.isMine : !cell.isMine;
      if (target && !cell.isShown) targetedCells.push({ i, j });
    }
  }
  return targetedCells;
}

function renderSafe(cords) {
  const elSafeMsg = document.querySelector(".safe-msg span");
  elSafeMsg.innerText = gGame.safe;

  if (cords) {
    const { i, j } = cords;
    let elCell = document.querySelector(`.cell-${i}-${j}`);
    elCell.classList.add("safe");
    setTimeout(() => {
      elCell.classList.remove("safe");
    }, 1300);
  }
}

function onManual(elManual) {
  const elTable = document.querySelector("table");
  const lvlSize = gLevel.SIZE;
  const lvlMines = gManualMinesLocations.length;
  const lvl = gLevel.LEVEL;

  if (elManual.innerText === "Start") {
    onInit({ s: lvlSize, m: lvlMines, l: lvl }, true, true);
    gGame.shownCount++;
    startGame({});
    gGame.isManual = false;

    elTable.classList.remove("manual");
    elManual.innerText = "Manual Mode";
    return;
  }

  onInit({ s: lvlSize, m: gLevel.MINES, l: lvl });
  gGame.isManual = true;
  elTable.classList.add("manual");
  elManual.innerText = "Start";
}

function addManualMines() {
  for (let i = 0; i < gManualMinesLocations.length; i++) {
    const mineLoc = gManualMinesLocations[i];

    gBoard[mineLoc.i][mineLoc.j].isMine = true;
  }
}
