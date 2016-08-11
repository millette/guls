#!/usr/bin/env node

'use strict'

const wi = require('./')

/*
wi('Communautés d\'utilisateurs et de développeurs de logiciels libres au Québec', true)
  .then((x) => {
    console.log(JSON.stringify(x, null, ' '))
  })
  .catch((e) => console.error(e))
*/

const wrk = (pages, allDone) => {
  const out = []
  let cnt = 0
  pages.forEach((page) => {
    wi.fetchByTitle(page)
      .then((x) => {
        out.push(x)
        if (++cnt === pages.length) { allDone(out) }
      })
      .catch((e) => {
        console.error(page, e)
        if (++cnt === pages.length) { allDone(out) }
      })
  })
}

wrk(
  ['Mozilla Québec', 'DebianQuebec'],
  (out2) => console.log('tadam', JSON.stringify(out2, null, ' '))
)
