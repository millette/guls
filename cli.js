#!/usr/bin/env node

'use strict'

const wi = require('./')

wi.updateDb('Communautés d\'utilisateurs et de développeurs de logiciels libres au Québec', true)

/*
var done = false

wi('Communautés d\'utilisateurs et de développeurs de logiciels libres au Québec', true)
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
*/
