// ==UserScript==
// @name        Kyll's things
// @namespace   Kyll
// @description Random chat improvements
// @include     *://chat.stackoverflow.com/rooms/*
// @version     1
// @grant       none
// @eat         waffle
// ==/UserScript==

window.Plop = window.Plop || {}
Plopify = (...args) => Object.assign(Plop, ...args)

CHAT.addEventHandlerHook(({event_type, time_stamp, message_id}) => {
  if(event_type === 1) {
    // We need the HTML element to exist, it's set synchronously
    // Thus, queue the query
    setTimeout(() => {
      // Add timestamp to the message itself
      document.getElementById(`message-${message_id}`)
        .setAttribute('timestamp', time_stamp)
    }, 0);
  }
})

GM.addStyle(
`
.two-minutes {
  border-top-style: solid;
  border-top-color: red;
  border-top-width: thin;
}

.five-minutes {
  border-top-style: solid;
  border-top-color: green;
  border-top-width: thin;
}

.ten-minutes {
  border-top-style: solid;
  border-top-color: blue;
  border-top-width: thin;
}
`
)

// Add some magic
HTMLCollection.prototype[Symbol.iterator] =
  HTMLCollection.prototype[Symbol.iterator] || Array.prototype[Symbol.iterator]

const twoMinutesClass = 'two-minutes'
    , fiveMinutesClass = 'five-minutes'
    , tenMinutesClass = 'ten-minutes'

    , testFiveSecondsClass = 'five-seconds'

Plopify({twoMinutesClass, fiveMinutesClass, tenMinutesClass, testFiveSecondsClass})

setInterval(function manageTimeLines() {
  const removeTimeLines = () => {
    [
      ...document.getElementsByClassName(twoMinutesClass)
      ,  ...document.getElementsByClassName(fiveMinutesClass)
      ,  ...document.getElementsByClassName(tenMinutesClass)

      ,  ...document.getElementsByClassName(testFiveSecondsClass)
    ].forEach(e => {
      e.classList.remove(twoMinutesClass)
      e.classList.remove(fiveMinutesClass)
      e.classList.remove(tenMinutesClass)

      e.classList.remove(testFiveSecondsClass)
    })
  }

  const addTimeLines = () => {
    const twoMinutesToMs = 1000 * 60 * 2
        , fiveMinutesToMs = 1000 * 60 * 5
        , tenMinutesToMs = 1000 * 60 * 10

        , testFiveSecondsToMs = 1000 * 5

    Plopify({twoMinutesToMs, fiveMinutesToMs, tenMinutesToMs, testFiveSecondsToMs})

    const allMessages = document.querySelectorAll('.message')
        , maxLookupAmount = Math.min(42, allMessages.length)
        , now = Date.now()

    Plopify({maxLookupAmount})

    let markedTwoMinutes = false
      , markedFiveMinutes = false
      , markedTenMinutes = false

      , testMarkedFiveSeconds = false

    for(i = allMessages.length - 1; i > allMessages.length - maxLookupAmount; i--) {
      let currentMessage = allMessages[i]
        // Fetch the timestamp on the HTML element, multiply by 1000 to get
        // millisecond precision
        , messageTimestamp = Number.parseInt(
          currentMessage.getAttribute('timestamp')
        ) * 1000

      if (
        messageTimestamp < (now - testFiveSecondsToMs)
        && !testMarkedFiveSeconds
      ) {
        currentMessage.classList.add(testFiveSecondsClass)
        testMarkedFiveSeconds = true
      }
      if (
        messageTimestamp < (now - twoMinutesToMs)
        && !markedTwoMinutes
      ) {
        currentMessage.classList.add(twoMinutesClass)
        markedTwoMinutes = true
      }
      if (
        messageTimestamp < (now - fiveMinutesToMs)
        && !markedFiveMinutes
      ) {
        currentMessage.classList.add(fiveMinutesClass)
        markedFiveMinutes = true
      }
      if (
        messageTimestamp < (now - tenMinutesToMs)
        && !markedTenMinutes
      ) {
        currentMessage.classList.add(tenMinutesClass)
        markedTenMinutes = true
      }
    }
  }

  removeTimeLines()

  addTimeLines()
}, 4200)
