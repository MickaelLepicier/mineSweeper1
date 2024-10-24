'use strict'

// hints
function renderHints(amount) {
  const elHints = document.querySelector('.hints')
  elHints.innerHTML = HINT.repeat(amount)
}

function onHintClicked() {
  if (!gGame.isOn || !gGame.hints) return
  const elTable = document.querySelector('table')
  const elCells = document.querySelectorAll('.cell')
  const elHints = document.querySelector('.hints')

  for (let i = 0; i < elCells.length; i++) {
    elCells[i].classList.toggle('hint')
  }

  elTable.classList.toggle('hint')
  elHints.classList.toggle('hint')
}

function getExpandCellCords(board, cellI, cellJ) {
  let expandCellCords = []
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue

      const cell = board[i][j]
      if (!cell.isShown && !cell.isMarked) {
        cell.isShown = true
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount
        if (cell.minesAroundCount === 0) cellContent = ''
        if (cell.isMine) cellContent = MINE

        renderCell({ i, j }, cellContent)

        expandCellCords.push({ i, j })
      }
    }
  }
  return expandCellCords
}

function unExpandCells(cords, isUndo = false) {
  for (let idx = 0; idx < cords.length; idx++) {
    if (isUndo) gGame.shownCount--

    const { i, j } = cords[idx]
    const cell = gBoard[i][j]
    cell.isShown = false
    let cellContent = cell.isMarked ? FLAG : ''
    renderCell({ i, j }, cellContent, false)
  }
}

// safe click
function onSafeClick() {
  if (!gGame.isOn || !gGame.safe) return
  const currMove = { isSafe: true }
  gGame.undo.push(currMove)

  const emptyCells = getTargetedCells(false)
  const randomIdx = getRandomInt(0, emptyCells.length - 1)

  gGame.safe--
  renderSafe(emptyCells[randomIdx])
}

function getTargetedCells(isMine) {
  let targetedCells = []
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      const target = isMine ? cell.isMine : !cell.isMine
      if (target && !cell.isShown) targetedCells.push({ i, j })
    }
  }
  return targetedCells
}

function renderSafe(cords = false) {
  const elSafeMsg = document.querySelector('.safe-msg span')
  elSafeMsg.innerText = gGame.safe

  if (cords) {
    const { i, j } = cords
    let elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.classList.add('safe')
    setTimeout(() => {
      elCell.classList.remove('safe')
    }, 1300)
  }
}

// manual mode
function onManual(elManual) {
  const elManualMsg = document.querySelector('.manual-mode-msg')
  const elTable = document.querySelector('table')
  const minesAmount = gMinesLocations.length
  const lvl = gLevel.LEVEL.toLowerCase()

  if (elManual.innerText === 'Start') {
    if (minesAmount < 3) {
      elManualMsg.innerText = 'Add more mines'
      return
    }
    onInit(lvl, false, true)

    startGame({})
    gGame.isManual = false

    gLevel.MINES = minesAmount
    renderTotalHiddenMines()
    elTable.classList.remove('manual')
    elManual.innerText = 'Manual Mode'
    elManualMsg.innerText = ''
    return
  }

  onInit(lvl, false, true)
  gMinesLocations = []

  elTable.classList.add('manual')
  elManual.innerText = 'Start'
}

function addManualMines() {
  for (let i = 0; i < gMinesLocations.length; i++) {
    const mineLoc = gMinesLocations[i]

    gBoard[mineLoc.i][mineLoc.j].isMine = true
  }
}

// undo function
function onUndo() {
  if (!gGame.isOn) return

  const lastMove = gGame.undo.pop()

  let cell
  if (lastMove.location) {
    const { i, j } = lastMove.location
    cell = gBoard[i][j]
  }

  if (lastMove.firstClick) {
    onInit({ s: gLevel.SIZE, m: gLevel.MINES, l: gLevel.LEVEL })
  }

  if (lastMove.isShown) {
    const { i, j } = lastMove.location
    cell.isShown = false
    gGame.shownCount--
    renderCell({ i, j }, '', false)
  }

  if (lastMove.isMarked) {
    const isMarked = lastMove.isMarked === 1
    cell.isMarked = isMarked

    gGame.markedCount += isMarked ? 1 : -1

    const content = isMarked ? FLAG : ''
    renderCell(lastMove.location, content, false)
  }

  if (lastMove.isMine) {
    const { i, j } = lastMove.location
    cell.isShown = false
    gGame.lives++
    gGame.minesShownCount--
    renderLives(gGame.lives)
    renderCell({ i, j }, '', false)
    renderTotalHiddenMines()
  }

  if (lastMove.isExpand && !lastMove.firstClick) {
    unExpandCells(lastMove.expandLocations, true)
  }

  if (lastMove.isSafe) {
    gGame.safe++
    renderSafe()
  }

  if (lastMove.isHint) {
    gGame.hints++
    renderHints(gGame.hints)
    return
  }
}

// dark-light mode function

function onDarkMode(elDarkMode) {
  gGame.isDark = !gGame.isDark
  elDarkMode.innerText = gGame.isDark ? 'Light Mode' : 'Dark Mode'
  document.querySelector('body').classList.toggle('dark-mode')
}

// mega hint
function onMegaHint(elMegaHint) {
  if (!gGame.isOn) return
  if (gGame.megaHint.clicks.length >= 2) return

  gGame.megaHint.isMegaHint = true
  elMegaHint.classList.add('btn-off')
  megaHintEffect()
}

function getMegaHintCords(cords) {
  // first and second clicks
  const fstClick = cords[0]
  const secClick = cords[1]

  // get start cords
  const startCordI = fstClick.i < secClick.i ? fstClick.i : secClick.i
  const startCordJ = fstClick.j < secClick.j ? fstClick.j : secClick.j

  // get last cords
  const lastCordI = fstClick.i > secClick.i ? fstClick.i : secClick.i
  const lastCordJ = fstClick.j > secClick.j ? fstClick.j : secClick.j

  let megaHintCords = []

  for (let i = startCordI; i <= lastCordI; i++) {
    for (let j = startCordJ; j <= lastCordJ; j++) {
      const cell = gBoard[i][j]

      if (!cell.isShown && !cell.isMarked) {
        cell.isShown = true
        let cellContent = cell.isMarked ? FLAG : cell.minesAroundCount
        if (cell.minesAroundCount === 0) cellContent = ''
        if (cell.isMine) cellContent = MINE
        renderCell({ i, j }, cellContent)

        megaHintCords.push({ i, j })
      }
    }
  }

  return megaHintCords
}

function renderClickedCells(cords) {
  const firstClick = cords[0]
  const secondClick = cords[1]

  const elFirstCell = document.querySelector(
    `.cell-${firstClick.i}-${firstClick.j}`
  )
  const elSecondCell = document.querySelector(
    `.cell-${secondClick.i}-${secondClick.j}`
  )

  setTimeout(() => {
    elFirstCell.classList.remove('megaHintColor')
    elSecondCell.classList.remove('megaHintColor')
  }, 1000)
}

// exterminator
function onExterminator(elExterminator) {
  if (!gGame.isOn || gGame.isExterminate) return

  gGame.isExterminate = true
  gMinesLocations = []

  updateMinesLocations()
  const minesLocations = gMinesLocations
  removeMines(minesLocations)
  renderBoard(gBoard)

  gMinesLocations = []
  elExterminator.classList.add('btn-off')
  exterminatorEffect()
}

function updateMinesLocations() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j]

      if (currCell.isMine && !currCell.isShown) gMinesLocations.push({ i, j })
    }
  }
}

function removeMines(cords) {
  for (let i = 0; i < 3; i++) {
    const randomIdx = getRandomInt(0, cords.length - 1)
    const randomMineCords = cords[randomIdx]

    removeMine(randomMineCords)
    cords.splice(randomIdx, 1)
  }
}

function removeMine(cords) {
  const { i, j } = cords
  const cell = gBoard[i][j]

  cell.isMine = false

  gLevel.MINES--

  renderCell(cords, '', false)
  renderTotalHiddenMines()
}

// best score
function bestScore() {
  const elTimer = document.querySelector('.timer')

  const currBoardSize = gLevel.SIZE
  const currLevel = gLevel.LEVEL
  const currTimer = elTimer.innerText

  const boardSizeItem = localStorage.getItem('bestScoreSize')

  if (!boardSizeItem) {
    addItems(currBoardSize, currLevel, currTimer)
    renderBestScore()
    return
  }

  const timerItem = localStorage.getItem('bestScoreTime')
  const bestTime = getTime(timerItem)
  const currTime = getTime(currTimer)

  if (currBoardSize >= boardSizeItem) {
    // is current level > best level
    if (currBoardSize > boardSizeItem) {
      updateBestScore(currBoardSize, currLevel, currTimer)
      return

      // is best minutes > current minutes
    } else if (bestTime.minutes > currTime.minutes) {
      updateBestScore(currBoardSize, currLevel, currTimer)
      return

      // is best seconds >= current seconds
    } else if (
      bestTime.minutes === currTime.minutes &&
      bestTime.seconds >= currTime.seconds
    ) {
      updateBestScore(currBoardSize, currLevel, currTimer)
      return
    }
  }
}

function updateBestScore(currBoardSize, currLevel, currTimer) {
  addItems(currBoardSize, currLevel, currTimer)
  renderBestScore()
}

function renderBestScore() {
  let levelItem = localStorage.getItem('bestScoreLevel')
  let timerItem = localStorage.getItem('bestScoreTime')
  if (!levelItem && !timerItem) return

  const elBestScore = document.querySelector('.best-score span')
  elBestScore.innerHTML = `${levelItem} - ${timerItem}`
}

function addItems(currBoardSize, currLevel, currTimer) {
  localStorage.setItem('bestScoreSize', currBoardSize)
  localStorage.setItem('bestScoreLevel', currLevel)
  localStorage.setItem('bestScoreTime', currTimer)
}

function getTime(str) {
  const splitTime = str.split(':')
  const time = { minutes: +splitTime[0], seconds: +splitTime[1] }

  return time
}
