'use strict'

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

const WINLOSE = `<img class="win-lose-logo-img" src="img/LEGO-logo.png" alt="lego-logo">`
const WIN = `<img class="win-lose-logo-img" src="img/head-win.png" alt="head">`
const LOSE = `<img class="win-lose-logo-img" src="img/head-lose.png" alt="head">`

const mineSound = new Audio('../sound/mine-explosion.mp3')
const winSound = new Audio('../sound/win.mp3')
const loseSound = new Audio('../sound/lose.mp3')

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

  document.querySelector('.win-lose-logo').innerHTML = WINLOSE
  document.querySelector('.win-lose-msg').innerHTML = ''
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
    mineSound.play()

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
  winLoseEffect()
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
    document.querySelector('.win-lose-logo').innerHTML = LOSE
    document.querySelector('.win-lose-msg').innerHTML = 'You Lost...'
    gGame.isOn = false
    loseSound.play()

    revealMines()
    stopTimer()
    winLoseEffect(false)

    // WIN condition
  } else if (gGame.lives && isAllCellsShown && isAllMinesMarked) {
    document.querySelector('.win-lose-logo').innerHTML = WIN
    document.querySelector('.win-lose-msg').innerHTML = 'You Win!'

    bestScore()
    gGame.isOn = false
    winSound.play()

    stopTimer()
    winLoseEffect(true)
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

// ~~~~~~~~ MODALS ~~~~~~~~

function openModal() {
  const elModal = document.querySelector('.how-to-play-modal')
  elModal.style.display = 'block'
}

function closeModal() {
  const elModal = document.querySelector('.how-to-play-modal')
  elModal.style.display = 'none'
}

function onKey(ev) {
  if (ev.key === 'Escape') closeModal('.how-to-play-modal')
}
