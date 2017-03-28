// ==UserScript==
// @name        SE chat timelines indicators
// @namespace   Kyll-things
// @author      Kyll
// @description Adds coloured lines between messages to indicate age
// @include     *://chat.stackoverflow.com/rooms/*
// @exclude     *://chat.stackoverflow.com/rooms/info/*
// @include     *://chat.meta.stackexchange.com/rooms/*
// @exclude     *://chat.meta.stackexchange.com/rooms/info/*
// @include     *://chat.stackexchange.com/rooms/*
// @exclude      *://chat.stackexchange.com/rooms/info/*
// @version     1.2
// @eat         waffle
// ==/UserScript==

// Add some Plop
window.Plop = window.Plop || {}
Plopify = (...args) => Object.assign(window.Plop, ...args)

const storeKey = 'plop-lines'

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
// Try until it found some messages on which to add timestamps
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
  const caughtEvents = [
    1, // new message
    2, // edit
    10 // deleted message
  ]
  if(caughtEvents.includes(event_type)) {
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

// Sophisticated.
const makeLine = (colour, durationSeconds, className) =>
  ({ colour, durationSeconds, className })

// Sequence ordered by duration in ascending order
// Example:
// [
//   { colour: 'red', durationSeconds: 120, className: 'two-minutes'}
// ]
const lines = []

const defaultLines = [
  {
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
  }
]

Object.defineProperties(lines, {
  addLine : {
    value: (colour, durationSeconds, className, doUpdate = true) => {
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
  },
  addMultipleLines: {
    value: (...linesSequence) => {
      linesSequence.forEach(line => lines.addLine(
        line.colour, line.durationSeconds, line.className, false
      ))
      lines.updateCSS()
    }
  },
  removeLine: {
    value: (index, doUpdate = true) => {
      lines.splice(index, 1)
      if(doUpdate) {
        lines.updateCSS()
      }
    }
  },
  removeMultipleLines: {
    value: (...indexes) => {
      indexes.forEach(index => lines.removeLine(index), false)
      lines.updateCSS()
    }
  },
  maxLookupAmount: {
    value: 42
  },
  CSSNode: {
    value: linesStyleNode
  },
  generateCSS: {
    value: () => lines.reduce((summedCSS, line) =>
      `${summedCSS}
      .message.${line.className} {
        border-bottom-style: solid!important;
        border-bottom-color: ${line.colour}!important;
        border-bottom-width: thin!important;
        padding-bottom: 1px!important;
      }`, '')
  },
  updateCSS: {
    value: () => lines.CSSNode.innerHTML = lines.generateCSS()
  },
  save: {
    value: () => localStorage.setItem('plop-lines', JSON.stringify([...lines]))
  },
  reset: {
    value: () => {
      localStorage.removeItem(storeKey)
      lines.removeMultipleLines(
        ...lines.keys()
      )
      lines.addMultipleLines(...defaultLines)
    }
  }
})

// TODO: That's overstepping the responsibility of this script.
// Need to hoist the "help" thingies in its own script and require it
Plop.help = () => console.log('Maybe you meant `Plop.halp()`?')
Plop.halp = () => console.log(
`Plop!
You can view the lines properties by typing Plop.lines in this console.
You can change any property of said lines with your debug tools or a command.
The colours must be CSS colours, such as "purple" or "0xFAFAFA"
Example:
    Plop.lines[0].colour = 'purple'
    Plop.lines[3].durationSeconds = 1200 // 20 minutes

To update deh CSS and make the changes appear:
    Plop.lines.updateCSS()

To add a new line, use the Plop.lines.addLine function.
First argument is the colour of the line.
Second argument is the duration in seconds it represents.
Third argument is the CSS class name it should use.
Example:
    Plop.lines.addLine('yellow', 180 /* three minutes */, 'three-minutes')

To remove a line, use the Plop.lines.removeLine function.
Only argument is the index (can be negative as reverse index).
Example:
    Plop.lines.removeLine(0)  // Remove first line
    Plop.lines.removeLine(-1) // Remove last line

Once you've done your changes, save them so that they persist across reloads:
    Plop.lines.save()

If you screwed up:
    Plop.reset()

Have fun!
 - Kyll
`
)


const storedLines = JSON.parse(localStorage.getItem(storeKey))

if(storedLines) {
  lines.addMultipleLines(...storedLines)
}
else {
  // Default lines
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
