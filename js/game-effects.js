'use strict'

function exterminatorEffect() {
  const elSuperman = document.querySelector('.exterminator-effect-container')
  elSuperman.style.opacity = 1
  setTimeout(() => {
    elSuperman.style.opacity = 0
  }, 5000)
}

function megaHintEffect() {
  const elBatman = document.querySelector('.mega-hint-effect-container')
  elBatman.style.opacity = 1
  setTimeout(() => {
    elBatman.style.opacity = 0
  }, 5000)
}

function winLoseEffect(isWin) {
  const elUpRightCnt = document.querySelector('.up-right-corner-container')
  const elUpRightSpeech = document.querySelector('.up-right-corner-speech')
  const elUpRightImg = document.querySelector('.up-right-corner-img')

  const elUpLeftCnt = document.querySelector('.up-left-corner-container')
  const elUpLeftSpeech = document.querySelector('.up-left-corner-speech')
  const elUpLeftImg = document.querySelector('.up-left-corner-img')

  const elBotRightCnt = document.querySelector('.bottom-right-corner-container')
  const elBotRightSpeech = document.querySelector('.bottom-right-corner-speech')
  const elBotRightImg = document.querySelector('.bottom-right-corner-img')

  const elBotLeftCnt = document.querySelector('.bottom-left-corner-container')
  const elBotLeftSpeech = document.querySelector('.bottom-left-corner-speech')
  const elBotLeftImg = document.querySelector('.bottom-left-corner-img')

  if (gGame.isOn) {
    elUpRightCnt.style.opacity =
      elUpLeftCnt.style.opacity =
      elBotRightCnt.style.opacity =
      elBotLeftCnt.style.opacity =
        0
    return
  }

  // Win conditions
  if (isWin) {
    elUpRightSpeech.innerText = 'Haha I knew you would win!'
    elUpRightImg.src = 'img/win/superman.png'

    elUpLeftSpeech.innerText = 'Yeah! you Won!'
    elUpLeftImg.src = 'img/win/batman.png'

    elBotRightSpeech.innerText = 'Weeeheee You Won!!'
    elBotRightImg.src = 'img/win/spiderman.png'

    elBotLeftSpeech.innerText = "I'm not here..."
    elBotLeftImg.src = 'img/win/deadpool.png'

    // Lose conditions
  } else {
    elUpRightSpeech.innerText = 'I expected more from you...'
    elUpRightImg.src = 'img/lose/superman.png'

    elUpLeftSpeech.innerText = 'How did you Lose?!'
    elUpLeftImg.src = 'img/lose/batman.png'

    elBotRightSpeech.innerText = 'Hahaha you Loser...'
    elBotRightImg.src = 'img/lose/harley.png'

    elBotLeftSpeech.innerText = "I'm coming for you, loser!"
    elBotLeftImg.src = 'img/lose/joker.png'
  }

  elUpRightCnt.style.opacity =
    elUpLeftCnt.style.opacity =
    elBotRightCnt.style.opacity =
    elBotLeftCnt.style.opacity =
      1
}
