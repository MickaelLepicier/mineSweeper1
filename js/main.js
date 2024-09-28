"use strict";

// console.log("js working");

// rest and check if there is something to add
// maybe put superman on Exterminator
// maybe put some music?

// UNDO is not working on mega hint and exterminator, and thats ok :)

let gBoard;

let gLevel;
let gGame;
let gStartTime;
let gTimerInterval;
let gMinesLocations;

const FLAG = "🚩";
const MINE = "💣";
const LIVE = `<img class="live-img" src="img/heart.png" alt="hint icon">`;
const HINT = `<img class="hint-img" src="img/hint.png" alt="hint icon">`;

const EASY = `<img class="level-img" src="img/head-easy.png" alt="head">`;
const NORMAL = `<img class="level-img" src="img/head-normal.png" alt="head">`;
const HARD = `<img class="level-img" src="img/head-hard.png" alt="head">`;

const WINLOSE = `<img class="win-lose-img" src="img/LEGO_logo.png" alt="head">`;
const WON = `<img class="win-lose-img" src="img/head-won.png" alt="head">`;
const LOSE = `<img class="win-lose-img" src="img/head-lose.png" alt="head">`;

function onInit(
  level = { s: 4, m: 4, l: "Easy" },
  clearStorage = true,
  onManual = false
) {
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
    safe: 3,
    isManual: onManual,
    undo: [],
    isDark: false,
    megaHint: { isMegaHint: false, clicks: [] },
    isExterminate: false,
  };

  if (!onManual) gMinesLocations = [];

  clearInterval(gTimerInterval);
  gTimerInterval = null;
  if (clearStorage) localStorage.clear();

  gBoard = buildBoard(gLevel.SIZE);
  render();

  document.querySelector(".win-lose").innerHTML = WINLOSE;
  document.querySelector(".mega-hint").classList.remove("btn-off");
  document.querySelector(".exterminator").classList.remove("btn-off");
}

function buildBoard(size) {
  let board = [];
  for (let i = 0; i < size; i++) {
    board.push([]);
    for (let j = 0; j < size; j++) {
      board[i][j] = buildCell();
    }
  }
  return board;
}

function buildCell() {
  return {
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

      let cellContent = getCellContent(cell);
      let shownClass = "";

      if (cell.isShown) shownClass = "shown";

      strHTML += `<td class="cell cell-${i}-${j} ${shownClass}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this,${i}, ${j})" >${cellContent}</td>`;
    }
    strHTML += "</tr>";
  }
  let elBoard = document.querySelector(".board");
  elBoard.innerHTML = strHTML;
}

// Count mines around a cell
function setMinesNegsCount(board, cellCords) {
  const { i, j } = cellCords;

  return countNegMines(board, i, j);
}

function onCellClicked(elCell, i, j) {
  const cell = gBoard[i][j];
  const isHint = elCell.classList.contains("hint");

  // is megaHint
  if (gGame.megaHint.isMegaHint) {
    const megaHintClicks = gGame.megaHint.clicks;

    megaHintClicks.push({ i, j });
    elCell.classList.add("megaHintColor");

    if (megaHintClicks.length === 2) {
      gGame.megaHint.isMegaHint = false;

      const megaHintCords = getMegaHintCords(megaHintClicks);
      renderClickedCells(megaHintClicks);
      setTimeout(() => unExpandCells(megaHintCords), 2000);
    }
    return;
  }

  // is manual
  if (gGame.isManual) {
    if (elCell.innerHTML === MINE) return;
    gMinesLocations.push({ i, j });
    renderCell({ i, j }, MINE);

    return;
  }

  // Enter on manual mode
  if (gGame.shownCount === 0 && gMinesLocations[0]) {
    const currMove = { location: { i, j }, firstClick: true };
    gGame.undo.push(currMove);
  }

  // Enter on first click and manual mode OFF
  if (gGame.shownCount === 0 && !gGame.undo[0]) {
    const currMove = { location: { i, j }, firstClick: true };
    gGame.undo.push(currMove);
    startGame({ i, j });
  }

  // is hint
  if (isHint) {
    const currMove = { isHint: true };
    gGame.undo.push(currMove);

    onHintClicked();
    gGame.hints--;
    renderHints(gGame.hints);

    const expandCellCords = getExpandCellCords(gBoard, i, j);
    setTimeout(() => unExpandCells(expandCellCords), 1000);
    return;
  }

  if (cell.isMarked || !gGame.isOn || cell.isShown) return;

  // is mine
  if (cell.isMine && !cell.isShown) {
    const currMove = { location: { i, j }, isMine: true };
    gGame.undo.push(currMove);

    gGame.lives--;
    gGame.minesShownCount++;

    renderLives(gGame.lives);
    renderTotalHiddenMines();

    // is mines around the cell 0
  } else if (cell.minesAroundCount === 0 && !cell.isShown) {
    const isFirstClick = gGame.shownCount === 0;

    const currMove = {
      firstClick: isFirstClick,
      isExpand: true,
      expandLocations: [],
    };
    gGame.undo.push(currMove);

    expandShown(gBoard, i, j);
  }
  updateCell(cell, { i, j });
}

function updateCell(cell, cords) {
  const { i, j } = cords;
  if (cell.minesAroundCount && !cell.isMine) {
    if (gGame.shownCount) {
      const currMove = { location: { i, j }, isShown: true };
      gGame.undo.push(currMove);
    }

    gGame.shownCount++;
  }

  cell.isShown = true;

  let cellContent = cell.isMine ? MINE : cell.minesAroundCount;
  if (cell.minesAroundCount === 0 && !cell.isMine) cellContent = "";

  renderCell({ i, j }, cellContent);

  checkGameOver();
}

function onCellMarked(elCell, i, j) {
  const cell = gBoard[i][j];
  if (cell.isShown || !gGame.lives || (gGame.shownCount && !gGame.isOn)) return;

  const marked = cell.isMarked ? 1 : 2;
  const currMove = { location: { i, j }, isMarked: marked };
  gGame.undo.push(currMove);

  cell.isMarked = !cell.isMarked;

  gGame.markedCount += cell.isMarked ? 1 : -1;
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
}

function checkGameOver() {
  const isAllCellsShown = gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES;
  const totalHiddenMines = gLevel.MINES - gGame.minesShownCount;
  const isAllMinesMarked = gGame.markedCount === totalHiddenMines;

  // LOSE condition
  if (!gGame.lives) {
    document.querySelector(".win-lose").innerHTML = LOSE;
    gGame.isOn = false;
    revealMines();
    stopTimer();

    // WON condition
  } else if (gGame.lives && isAllCellsShown && isAllMinesMarked) {
    document.querySelector(".win-lose").innerHTML = WON;
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

      const cell = board[i][j];

      if (!cell.isMine && !cell.isShown && !cell.isMarked) {
        const currMove = { i, j };
        gGame.undo[gGame.undo.length - 1].expandLocations.push(currMove);

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
  elLives.innerHTML = lives;
}

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
        currCell.isShown = true;
        renderCell({ i, j }, MINE);
      }
    }
  }
}

function renderTotalHiddenMines() {
  const totalHiddenMines = gLevel.MINES - gGame.minesShownCount;
  const elTotalHiddenMines = document.querySelector(".total-hidden-mines span");
  elTotalHiddenMines.innerText = totalHiddenMines;
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

  minutes = String(minutes).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");

  renderTimer(minutes, seconds);
}

function renderTimer(minutes = "00", seconds = "00") {
  const elTimer = document.querySelector(".timer");
  elTimer.innerText = `${minutes}:${seconds}`;
}

// ~~~~~~~~ BONUS FUNCTIONS ~~~~~~~~

// hints functions
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

function unExpandCells(cords, isUndo = false) {
  for (let idx = 0; idx < cords.length; idx++) {
    if (isUndo) gGame.shownCount--;

    const { i, j } = cords[idx];
    const cell = gBoard[i][j];
    cell.isShown = false;
    let cellContent = cell.isMarked ? FLAG : "";
    renderCell({ i, j }, cellContent, false);
  }
}

// best score functions
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
  const bestTime = getTime(timerItem);
  const currTime = getTime(currTimer);

  if (currBoardSize >= boardSizeItem) {
    // is current level > best level
    if (currBoardSize > boardSizeItem) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;

      // is best minutes > current minutes
    } else if (bestTime.minutes > currTime.minutes) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;

      // is best seconds >= current seconds
    } else if (
      bestTime.minutes === currTime.minutes &&
      bestTime.seconds >= currTime.seconds
    ) {
      updateBestScore(currBoardSize, currLevel, currTimer);
      return;
    }
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

function getTime(str) {
  const splitTime = str.split(":");
  const time = { minutes: +splitTime[0], seconds: +splitTime[1] };

  return time;
}

// safe click functions
function onSafeClick() {
  if (!gGame.isOn || !gGame.safe) return;
  const currMove = { isSafe: true };
  gGame.undo.push(currMove);

  const emptyCells = getTargetedCells(false);
  const randomIdx = getRandomInt(0, emptyCells.length - 1);

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

function renderSafe(cords = false) {
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

// manual mode functions
function onManual(elManual) {
  const elManualMsg = document.querySelector(".manual-mode-msg");
  const elTable = document.querySelector("table");
  const lvlSize = gLevel.SIZE;
  const lvlMines = gMinesLocations.length;
  const lvl = gLevel.LEVEL;

  if (elManual.innerText === "Start") {
    if (lvlMines < 3) {
      elManualMsg.innerText = "Add more mines";
      return;
    }
    onInit({ s: lvlSize, m: lvlMines, l: lvl }, false, true);

    startGame({});
    gGame.isManual = false;

    elTable.classList.remove("manual");
    elManual.innerText = "Manual Mode";
    elManualMsg.innerText = "";
    return;
  }

  onInit({ s: lvlSize, m: gLevel.MINES, l: lvl }, false, true);
  gMinesLocations = [];

  elTable.classList.add("manual");
  elManual.innerText = "Start";
}

function addManualMines() {
  for (let i = 0; i < gMinesLocations.length; i++) {
    const mineLoc = gMinesLocations[i];

    gBoard[mineLoc.i][mineLoc.j].isMine = true;
  }
}

// undo function
function onUndo() {
  if (!gGame.isOn) return;

  const lastMove = gGame.undo.pop();

  let cell;
  if (lastMove.location) {
    const { i, j } = lastMove.location;
    cell = gBoard[i][j];
  }

  if (lastMove.firstClick) {
    onInit({ s: gLevel.SIZE, m: gLevel.MINES, l: gLevel.LEVEL });
  }

  if (lastMove.isShown) {
    const { i, j } = lastMove.location;
    cell.isShown = false;
    gGame.shownCount--;
    renderCell({ i, j }, "", false);
  }

  if (lastMove.isMarked) {
    const isMarked = lastMove.isMarked === 1;
    cell.isMarked = isMarked;

    gGame.markedCount += isMarked ? 1 : -1;

    const content = isMarked ? FLAG : "";
    renderCell(lastMove.location, content, false);
  }

  if (lastMove.isMine) {
    const { i, j } = lastMove.location;
    cell.isShown = false;
    gGame.lives++;
    gGame.minesShownCount--;
    renderLives(gGame.lives);
    renderCell({ i, j }, "", false);
    renderTotalHiddenMines();
  }

  if (lastMove.isExpand && !lastMove.firstClick) {
    unExpandCells(lastMove.expandLocations, true);
  }

  if (lastMove.isSafe) {
    gGame.safe++;
    renderSafe();
  }

  if (lastMove.isHint) {
    gGame.hints++;
    renderHints(gGame.hints);
    return;
  }
}

// dark-light mode function

function darkMode(elDarkMode) {
  gGame.isDark = !gGame.isDark;
  elDarkMode.innerText = gGame.isDark ? "Light Mode" : "Dark Mode";
  document.querySelector("body").classList.toggle("dark");
}

// mega hint functions
function onMegaHint(elMegaHint) {
  if (!gGame.isOn) return;
  if (gGame.megaHint.clicks.length >= 2) return;

  gGame.megaHint.isMegaHint = true;
  elMegaHint.classList.add("btn-off");
}

function getMegaHintCords(cords) {
  // first and second clicks
  const fstClick = cords[0];
  const secClick = cords[1];

  // get start cords
  const startCordI = fstClick.i < secClick.i ? fstClick.i : secClick.i;
  const startCordJ = fstClick.j < secClick.j ? fstClick.j : secClick.j;

  // get last cords
  const lastCordI = fstClick.i > secClick.i ? fstClick.i : secClick.i;
  const lastCordJ = fstClick.j > secClick.j ? fstClick.j : secClick.j;

  let megaHintCords = [];

  for (let i = startCordI; i <= lastCordI; i++) {
    for (let j = startCordJ; j <= lastCordJ; j++) {
      const cell = gBoard[i][j];

      if (!cell.isShown && !cell.isMarked) {
        cell.isShown = true;
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount;
        if (cell.minesAroundCount === 0) cellContent = "";
        if (cell.isMine) cellContent = MINE;
        renderCell({ i, j }, cellContent);

        megaHintCords.push({ i, j });
      }
    }
  }

  return megaHintCords;
}

function renderClickedCells(cords) {
  const firstClick = cords[0];
  const secondClick = cords[1];

  const elFirstCell = document.querySelector(
    `.cell-${firstClick.i}-${firstClick.j}`
  );
  const elSecondCell = document.querySelector(
    `.cell-${secondClick.i}-${secondClick.j}`
  );

  setTimeout(() => {
    elFirstCell.classList.remove("megaHintColor");
    elSecondCell.classList.remove("megaHintColor");
  }, 1000);
}

// exterminator functions
function onExterminator(elExterminator) {
  if (!gGame.isOn || gGame.isExterminate) return;

  gGame.isExterminate = true;
  gMinesLocations = [];

  updateGMinesLocations();
  const minesLocations = gMinesLocations;
  removeThreeMines(minesLocations);
  renderBoard(gBoard);

  gMinesLocations = [];
  elExterminator.classList.add("btn-off");
}

function updateGMinesLocations() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j];

      if (currCell.isMine && !currCell.isShown) gMinesLocations.push({ i, j });
    }
  }
}

function removeThreeMines(cords) {
  for (let i = 0; i < 3; i++) {
    const randomIdx = getRandomInt(0, cords.length - 1);
    const randomMineCords = cords[randomIdx];

    removeMine(randomMineCords);
    cords.splice(randomIdx, 1);
  }
}

function removeMine(cords) {
  const { i, j } = cords;
  const cell = gBoard[i][j];

  cell.isMine = false;

  gLevel.MINES--;

  renderCell(cords, "", false);
  renderTotalHiddenMines();
}
