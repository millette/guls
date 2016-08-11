#!/usr/bin/env node

'use strict'

const wi = require('./')

wi('Communautés d\'utilisateurs et de développeurs de logiciels libres au Québec', true)
  .then((x) => {
    console.log(JSON.stringify(x, null, ' '))
  })
  .catch((e) => console.error(e))
