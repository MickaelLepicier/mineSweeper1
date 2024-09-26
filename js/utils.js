"use strict";

// console.log("js utils working");

function countNegMines(board, cellI, cellJ) {
  let countMines = 0;

  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue;

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;
      if (i === cellI && j === cellJ) continue;

      if (board[i][j].isMine) countMines++;
    }
  }

  return countMines;
}

function renderCell(location, content, isShown = true) {
  // Select the elCell and set the value
  let elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  if (isShown) {
    elCell.classList.add("shown");
  } else {
    elCell.classList.remove("shown");
  }
  elCell.innerHTML = content;
}

function getRandomCords() {
  const randomRowInx = getRandomInt(0, gLevel.SIZE - 1);
  const randomColInx = getRandomInt(0, gLevel.SIZE - 1);
  return { i: randomRowInx, j: randomColInx };
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}


function render(){
  renderBoard(gBoard);
  renderLevelBtn();
  renderLives(gGame.lives);
  renderTotalHiddenMines();
  renderHints(gGame.hints);
  renderTimer();
  renderBestScore();
  renderSafe();
}