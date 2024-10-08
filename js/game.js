'use strict'

// console.log("js working");

// TODO-1
// look at the message and make the code better
// look at the recording and make the code better
// ask for CR in the open room

// keyboard shortcuts Links:

// https://support.apple.com/en-il/102650

// https://www.computerworld.com/article/1630407/30-keyboard-shortcuts-mac-users-need-to-know.html

/*

V In css font-size we prefer to use em. (2em is around 32px)

V In css use -- to create  inside the css and it will make code shorter and better

V Names of Files will be with - and not with big letters

V Names of Folders will always be single name as - img, sound and not as - imgs, sounds

V All the code will be without ;

V In github write in the commit exactly what you have beet updated

V check and train yourself more about keyboard shortcuts: https://support.apple.com/en-il/102650

V In HTML the order of the JS files that we draws are from the important to the less important -> main.js and below utils.js

V Create more js files to be more organize - game.js , game-tools.js , and more if needed

V In render use repeat instead of loops

V In JS it is better to change the class then the direct style

V In sound the files will always be on mp3




---------------------------------------------------------------------------------------------------------------------------------------


CSS lesson:

no no for px

1. text-align: justify

2. on top of every css: bsb
* { 
box-sizing: border-box
}
or in short - bsb

3. overflow
overflow: hidden
overflow: scroll
overflow-x: scroll
overflow-y: hidden

4. outline

5. direction: rtl

6. writing-mode: vertical-rl

7. instead of padding-left we use - logical properties (padding-inline-start)

8. line-height
 
9. width: 50vh - use more vh or vw instead of px or %

10. calc() - function that calculate different units as 10vh - 5px
example =  min-height: calc(10vh - 5px)
calc() can be very good to put footer on the bottom of the page.


11. very good for block of text:
width: ...vh
max-width: 75ch  (ch is for characters, 75 is for the best length of the line)
 
 or in short = width: min(...vh, 75ch)

12. use css variables

:root {
--code...
}

13. instead of
border-left -> border-inline-start
border-bottom -> border-block-end

14. :first-child{}
:last-child{}
:nth-child(even){}
:nth-child(3n){}
:nth-child(3n+2){}

14.
    .class .class2{}    // effects each class2 that a child of class (class2 inside class)
   .class.class2{}     // effects each element that has class2 AND class 
  .class, .class2{}   // effects each element that has class2 OR class 
.class > .class2{}   // effects each element class2 that direct descendant of class 


// TODO about CSS - play the games:
// https://flukeout.github.io/
// https://www.w3schools.com/css/exercise.asp


---------------------------------------------------------------------------------------------------------------------------------------


TODO - watch Yaron speaking about my project 

"ברגע שנדע את להשתמש ב7 הכלים שיש למתכנת, נדע לעבוד עם כל שפת תכנות שיש"
משתנים, ביטויים, תנאים, לולאות, פונקציות, מערכים ואובייקטים
יש אותם בכל שפות התכנות, ברגע שאנחנו שולטים בהם אז יהיה לנו קל יותר ללמוד כל שפת תכנות שיש


בספרינט שלי:
אני שם transition  ברקורסיה

*/

// TODO-2 later on I can do this as well:
// "How to play" modal
// Maybe put some music
// Win lose modal ?
// Put lego buttons on the board

// link : https://www.pngegg.com/en/png-wlthb

// UNDO is not working on mega hint and exterminator, and thats ok :)

let gBoard

let gGame
let gLevel
let gStartTime
let gTimerInterval
let gMinesLocations

const FLAG = '🚩'
const MINE = '💣'
const LIVE = `<img class="live-img" src="img/heart.png" alt="hint icon">`
const HINT = `<img class="hint-img" src="img/hint.png" alt="hint icon">`

const EASY = `<img class="level-img" src="img/head-easy.png" alt="head">`
const NORMAL = `<img class="level-img" src="img/head-normal.png" alt="head">`
const HARD = `<img class="level-img" src="img/head-hard.png" alt="head">`

const WINLOSE = `<img class="win-lose-img" src="img/LEGO-logo.png" alt="lego-logo">`
const WON = `<img class="win-lose-img" src="img/head-won.png" alt="head">`
const LOSE = `<img class="win-lose-img" src="img/head-lose.png" alt="head">`

function onInit(gameLevel, clearStorage = true, onManual = false) {
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
    isExterminate: false
  }

  const level = updateLevel(gameLevel)
  gLevel = {
    SIZE: level.s,
    MINES: level.m,
    LEVEL: level.l
  }

  if (!onManual) gMinesLocations = []

  clearInterval(gTimerInterval)
  gTimerInterval = null
  if (clearStorage) localStorage.clear()

  gBoard = buildBoard(gLevel.SIZE)
  render()

  document.querySelector('.win-lose').innerHTML = WINLOSE
  document.querySelector('.mega-hint').classList.remove('btn-off')
  document.querySelector('.exterminator').classList.remove('btn-off')
}

function updateLevel(level = 'easy') {
  if (level === 'easy') return { s: 4, m: 4, l: 'Easy' }
  else if (level === 'normal') return { s: 8, m: 12, l: 'Normal' }
  else if (level === 'hard') return { s: 16, m: 40, l: 'Hard' }
}

function buildBoard(size) {
  let board = []
  for (let i = 0; i < size; i++) {
    board.push([])
    for (let j = 0; j < size; j++) {
      board[i][j] = buildCell()
    }
  }
  return board
}

function buildCell() {
  return {
    minesAroundCount: 0,
    isShown: false,
    isMine: false,
    isMarked: false
  }
}

function renderBoard(board) {
  let strHTML = ''

  for (let i = 0; i < board.length; i++) {
    strHTML += '<tr>'
    for (let j = 0; j < board[0].length; j++) {
      let cell = board[i][j]

      cell.minesAroundCount = setMinesNegsCount(board, { i, j })

      let cellContent = getCellContent(cell)
      let shownClass = ''

      if (cell.isShown) shownClass = 'shown'

      strHTML += `<td class="cell cell-${i}-${j} ${shownClass}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this,${i}, ${j})" >${cellContent}</td>`
    }
    strHTML += '</tr>'
  }
  let elBoard = document.querySelector('.board')
  elBoard.innerHTML = strHTML
}

// Count mines around a cell
function setMinesNegsCount(board, cellCords) {
  const { i, j } = cellCords

  return countNegMines(board, i, j)
}

function onCellClicked(elCell, i, j) {
  const cell = gBoard[i][j]
  const isHint = elCell.classList.contains('hint')

  // is megaHint
  if (gGame.megaHint.isMegaHint) {
    const megaHintClicks = gGame.megaHint.clicks

    megaHintClicks.push({ i, j })
    elCell.classList.add('megaHintColor')

    if (megaHintClicks.length === 2) {
      gGame.megaHint.isMegaHint = false

      const megaHintCords = getMegaHintCords(megaHintClicks)
      renderClickedCells(megaHintClicks)
      setTimeout(() => unExpandCells(megaHintCords), 2000)
    }
    return
  }

  // is manual
  if (gGame.isManual) {
    if (elCell.innerHTML === MINE) return
    gMinesLocations.push({ i, j })
    renderCell({ i, j }, MINE)

    return
  }

  // Enter on manual mode
  if (gGame.shownCount === 0 && gMinesLocations[0]) {
    const currMove = { location: { i, j }, firstClick: true }
    gGame.undo.push(currMove)
  }

  // Enter on first click and manual mode OFF
  if (gGame.shownCount === 0 && !gGame.undo[0]) {
    const currMove = { location: { i, j }, firstClick: true }
    gGame.undo.push(currMove)
    startGame({ i, j })
  }

  // is hint
  if (isHint) {
    const currMove = { isHint: true }
    gGame.undo.push(currMove)

    onHintClicked()
    gGame.hints--
    renderHints(gGame.hints)

    const expandCellCords = getExpandCellCords(gBoard, i, j)
    setTimeout(() => unExpandCells(expandCellCords), 1000)
    return
  }

  if (cell.isMarked || !gGame.isOn || cell.isShown) return

  // is mine
  if (cell.isMine && !cell.isShown) {
    const currMove = { location: { i, j }, isMine: true }
    gGame.undo.push(currMove)

    gGame.lives--
    gGame.minesShownCount++

    renderLives(gGame.lives)
    renderTotalHiddenMines()

    // is mines around the cell 0
  } else if (cell.minesAroundCount === 0 && !cell.isShown) {
    const isFirstClick = gGame.shownCount === 0

    const currMove = {
      firstClick: isFirstClick,
      isExpand: true,
      expandLocations: []
    }
    gGame.undo.push(currMove)

    expandShown(gBoard, i, j)
  }
  updateCell(cell, { i, j })
}

function updateCell(cell, cords) {
  const { i, j } = cords
  if (cell.minesAroundCount && !cell.isMine) {
    if (gGame.shownCount) {
      const currMove = { location: { i, j }, isShown: true }
      gGame.undo.push(currMove)
    }

    gGame.shownCount++
  }

  cell.isShown = true

  let cellContent = cell.isMine ? MINE : cell.minesAroundCount
  if (cell.minesAroundCount === 0 && !cell.isMine) cellContent = ''

  renderCell({ i, j }, cellContent)

  checkGameOver()
}

function onCellMarked(elCell, i, j) {
  const cell = gBoard[i][j]
  if (cell.isShown || !gGame.lives || (gGame.shownCount && !gGame.isOn)) return

  const marked = cell.isMarked ? 1 : 2
  const currMove = { location: { i, j }, isMarked: marked }
  gGame.undo.push(currMove)

  cell.isMarked = !cell.isMarked

  gGame.markedCount += cell.isMarked ? 1 : -1
  elCell.innerHTML = cell.isMarked ? FLAG : ''
  checkGameOver()
}

function startGame(cellClickedCords) {
  gGame.isOn = true
  addMines(cellClickedCords, gGame.isManual)
  renderBoard(gBoard)
  startTimer()
}

function addMines(cellClickedCords, isManual = false) {
  if (isManual) {
    addManualMines()
    return
  }

  for (let i = 0; i < gLevel.MINES; i++) {
    let randomCords = getRandomCords()
    if (
      (randomCords.i === cellClickedCords.i &&
        randomCords.j === cellClickedCords.j) ||
      gBoard[randomCords.i][randomCords.j].isMine
    ) {
      i--
      continue
    }
    gBoard[randomCords.i][randomCords.j].isMine = true
  }
}

function checkGameOver() {
  const isAllCellsShown = gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES
  const totalHiddenMines = gLevel.MINES - gGame.minesShownCount
  const isAllMinesMarked = gGame.markedCount === totalHiddenMines

  // LOSE condition
  if (!gGame.lives) {
    document.querySelector('.win-lose').innerHTML = LOSE
    gGame.isOn = false
    revealMines()
    stopTimer()

    // WON condition
  } else if (gGame.lives && isAllCellsShown && isAllMinesMarked) {
    document.querySelector('.win-lose').innerHTML = WON
    bestScore()
    gGame.isOn = false
    stopTimer()
  }
}

function expandShown(board, cellI, cellJ) {
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue

      const cell = board[i][j]

      if (!cell.isMine && !cell.isShown && !cell.isMarked) {
        const currMove = { i, j }
        gGame.undo[gGame.undo.length - 1].expandLocations.push(currMove)

        cell.isShown = true
        gGame.shownCount++
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount
        if (cell.minesAroundCount === 0) cellContent = ''
        renderCell({ i, j }, cellContent)

        if (cell.minesAroundCount === 0) expandShown(board, i, j)
      }
    }
  }
}

function renderLives(amount) {
  const elLives = document.querySelector('.live')
  elLives.innerHTML = LIVE.repeat(amount)
}

function renderLevelBtns() {
  document.querySelector(`.easy`).innerHTML = EASY
  document.querySelector(`.normal`).innerHTML = NORMAL
  document.querySelector(`.hard`).innerHTML = HARD
}

function revealMines() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j]

      if (!currCell.isShown && currCell.isMine) {
        currCell.isShown = true
        renderCell({ i, j }, MINE)
      }
    }
  }
}

function renderTotalHiddenMines() {
  const totalHiddenMines = gLevel.MINES - gGame.minesShownCount
  const elTotalHiddenMines = document.querySelector('.total-hidden-mines span')
  elTotalHiddenMines.innerText = totalHiddenMines
}

// ~~~~~~~~ TIMER ~~~~~~~~

function startTimer() {
  gStartTime = Date.now()
  gTimerInterval = setInterval(updateTimer, 60)
}

function stopTimer() {
  clearInterval(gTimerInterval)
}

function updateTimer() {
  const currTime = Date.now()
  const currMillSec = currTime - gStartTime

  let minutes = Math.floor((currMillSec / (1000 * 60)) % 60)
  let seconds = Math.floor((currMillSec / 1000) % 60)

  minutes = String(minutes).padStart(2, '0')
  seconds = String(seconds).padStart(2, '0')

  renderTimer(minutes, seconds)
}

function renderTimer(minutes = '00', seconds = '00') {
  const elTimer = document.querySelector('.timer')
  elTimer.innerText = `${minutes}:${seconds}`
}
