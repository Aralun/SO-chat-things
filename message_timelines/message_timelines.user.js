// ==UserScript==
// @name        SO Time Lines
// @namespace   Kyll-things
// @description Random chat improvements
// @include     *://chat.stackoverflow.com/rooms/*
// @version     1
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
const headNode = document.getElementsByTagName('head')[0]
    , styleNode = document.createElement('style')

headNode.appendChild(styleNode)
//TODO: Do this programmatically, kind of ugly atm
styleNode.innerHTML = '.message.two-minutes {  border-bottom-style: solid!important;  border-bottom-color: red!important;  border-bottom-width: thin!important;}.message.five-minutes {  border-bottom-style: solid!important;  border-bottom-color: green!important;  border-bottom-width: thin!important;}.message.ten-minutes {  border-bottom-style: solid!important;  border-bottom-color: blue!important;  border-bottom-width: thin!important;}'

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
    }, 0);
  }
})

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
