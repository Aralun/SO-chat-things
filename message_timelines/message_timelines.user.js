// ==UserScript==
// @name        SO Time Lines
// @namespace   Kyll-things
// @author      Kyll
// @description Random chat improvements
// @include     *://chat.stackoverflow.com/rooms/*
// @exclude     *://chat.stackoverflow.com/rooms/info/*
// @include     *://chat.meta.stackexchange.com/rooms/*
// @exclude     *://chat.meta.stackexchange.com/rooms/info/*
// @include     *://chat.stackexchange.com/rooms/*
// @exlude      *://chat.stackexchange.com/rooms/info/*
// @version     1.1
// @eat         waffle
// ==/UserScript==

// Add some Plop
window.Plop = window.Plop || {}
Plopify = (...args) => Object.assign(window.Plop, ...args)

// Add some magic
HTMLCollection.prototype[Symbol.iterator] =
  HTMLCollection.prototype[Symbol.iterator] || Array.prototype[Symbol.iterator]
NodeList.prototype[Symbol.iterator] =
  NodeList.prototype[Symbol.iterator] || Array.prototype[Symbol.iterator]

// Add some style
const linesStyleNode = document.createElement('style')
document.head.appendChild(linesStyleNode)

// Add timestamps on all existing messages
// This requires the DOM to be loaded.
// Try until it worked
// If anyone has some kind of cleaner way to do this (event?), I'm taker
const allTimestampsInterval = setInterval(function tryAddAllTimestamps() {
  const allMessages = document.querySelectorAll('*[id^="message-"]')

  for(let message of allMessages) {
    let timestamp = $.data(message, 'info') && $.data(message, 'info').time
    message.setAttribute('timestamp', timestamp)
  }

  if(allMessages.length > 0) {
    clearInterval(allTimestampsInterval)
  }
}, 2000)

CHAT.addEventHandlerHook(({event_type, time_stamp, message_id}) => {
  // New message
  if(event_type === 1) {
    // We need the HTML element to exist, it's set synchronously
    // Thus, queue the query
    setTimeout(() => {
      const element = document.getElementById(`message-${message_id}`)
      if (element) {
        element.setAttribute('timestamp', time_stamp)
      }
    }, 0)
  }
})

const makeLine = (colour, durationSeconds, className) =>
  ({ colour, durationSeconds, className })

// Sequence ordered by duration in ascending order
// Example:
// [
//   { colour: 'red', duration: 120, className: 'two-minutes'}
// ]
const lines = []
lines.maxLookupAmount = 42
lines.addLine = (colour, durationSeconds, className, doUpdate = true) => {
  const newLine = makeLine(colour, durationSeconds, className)
      , indexToInsert = lines.findIndex(e => e.durationSeconds > durationSeconds)

  if(indexToInsert === -1) {
    lines.push(newLine)
  }
  else {
    lines.splice(
      indexToInsert,
      0,
      newLine
    )
  }
  if(doUpdate) {
    lines.updateCSS()
  }
}

lines.addMultipleLines = (...linesSequence) => {
  linesSequence.forEach(line => lines.addLine(
    line.colour, line.durationSeconds, line.className, false
  ))
  lines.updateCSS()
}

lines.CSSNode = linesStyleNode
lines.generateCSS = () => lines.reduce((summedCSS, line) =>
  `${summedCSS}
  .message.${line.className} {
    border-bottom-style: solid!important;
    border-bottom-color: ${line.colour}!important;
      border-bottom-width: thin!important;
  }`, '')
lines.updateCSS = () => {
  lines.CSSNode.innerHTML = lines.generateCSS()
}

// Default lines
if(lines.length === 0) {
  lines.addMultipleLines({
    colour: 'red',
    durationSeconds: 120,
    className: 'two-minutes'
  },
  {
    colour: 'green',
    durationSeconds: 300,
    className: 'five-minutes'
  },
  {
    colour: 'blue',
    durationSeconds: 600,
    className: 'ten-minutes'
  })
}

Plopify({ lines })

setInterval(function manageTimeLines() {
  const removeAllLines = () => {
    // TODO: Implement Timeouts instead of raw removals
    const allClasses = lines.map(line => line.className)
    // Ninja it to array because element collections suck
    allClasses
      .map(className => document.getElementsByClassName(className))
      .forEach(elementsCollection =>
        [...elementsCollection].forEach(element =>
          element.classList.remove(...allClasses)
        )
      )
  }

  const addLines = () => {
    const allMessages = document.querySelectorAll('.message')
        , maxLookupAmount = Math.min(lines.maxLookupAmount, allMessages.length)
        , now = Date.now()

        , thresholds = [...lines]

    for(let i = allMessages.length - 1; i > allMessages.length - maxLookupAmount; i--) {
      const currentLine = thresholds[0]
          , currentMessage = allMessages[i]
          , messageTimestamp = Number.parseInt(
            currentMessage.getAttribute('timestamp')
          ) * 1000

      if(!currentLine) {
        // No more lines to add, quit
        break
      }

      if(
        messageTimestamp < (now - (currentLine.durationSeconds * 1000))
      ) {
        currentMessage.classList.add(currentLine.className)

        // We're done with this line, remove it
        thresholds.shift()
        // A message can have multiple lines attached, so redo this round
        i++
      }
    }
  }

  removeAllLines()

  addLines()
}, 420)
