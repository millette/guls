#!/usr/bin/env node

'use strict'

const wi = require('./')

var done = false
wi.wrk2('Communautés d\'utilisateurs et de développeurs de logiciels libres au Québec')
  .then((out2) => {
    done = true
    console.log(JSON.stringify(out2, null, ' '))
  })
  .catch((e) => {
    console.error('EE:', e)
    done = true
  })

const i = setInterval(() => {
  if (done) { clearInterval(i) }
}, 300)
