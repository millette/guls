'use strict'

// npm
const got = require('got')
const RLP = require('rate-limit-promise')

const rateLimter = new RLP(6, 6000)

const fetchByTitle = (title, redir) => rateLimter()
  .then(got.bind(null, `http://wiki.facil.qc.ca/api.php?format=json&action=query&titles=${title}&prop=contributors|fileusage|info|pageprops|redirects|revisions`, { json: true }))
  .then((x) => x.body.query)
  .then((x) => {
    if (!x.pages) { throw new Error('Should result in a single page id.') }
    if (x.pages['-1']) { throw new Error('Not found.') }
    const pageids = Object.keys(x.pages)
    if (pageids.length !== 1) { throw new Error('Should result in a single page id.') }
    const d = x.pages[pageids[0]]
    delete x.pages
    delete x.normalized
    return Promise.all([Object.assign(x, d), got(`http://wiki.facil.qc.ca/api.php?format=json&action=parse&pageid=${pageids[0]}&prop=wikitext`, { json: true })])
  })
  .then((x) => {
    if (x[1].body.parse.wikitext['*'].indexOf('#REDIRECT ')) {
      const ret = x[0]
      ret.wikitext = x[1].body.parse.wikitext['*']
      return ret
    } else {
      return fetchByTitle(x[1].body.parse.wikitext['*'].slice(12, -2))
    }
  })

const parseHeader = (wikitext) => {
  const keys = wikitext.split('\n')
  if (keys.some((x) => x[0] !== '!')) { throw new Error('Header problem.') }
  return keys.map((x) => x.slice(1).trim())
}

const parseRow = (header, wikitext) => {
  const keys = wikitext.trim().split('\n')
  if (keys.some((x) => x[0] !== '|')) { throw new Error('Row problem.') }
  const ret = { }
  keys.forEach((x, n) => {
    const out = x.slice(1).trim()
    if (out.length <= 1) { return }
    if (!header[n]) { throw new Error('Row problem.') }
    ret[header[n]] = out
  })
  return ret
}

const fetchTablePage = (page, keepWikitext) => fetchByTitle(page)
  .then((x) => {
    const re = /^\{\|([^]+)\|\}$/m
    const w1 = re.exec(x.wikitext)[1].split('|-\n').slice(1)
    const header = parseHeader(w1.shift().trim())
    const parser = parseRow.bind(null, header)
    x.rows = w1.map((y) => parser(y))
    if (!keepWikitext) { delete x.wikitext }
    return x
  })

const wrk = (pages) => new Promise((resolve, reject) => {
  const out = []
  pages.forEach((page) => {
    fetchByTitle(page)
      .then((x) => {
        out.push(x)
        if (out.length === pages.length) { resolve(out) }
      })
      .catch((e) => {
        out.push({ error: 404, page: page })
        if (out.length === pages.length) { resolve(out) }
      })
  })
})

const fetchAll = (page) => fetchTablePage(page)
  .then((x) => Promise.all([x, wrk(x.rows.map((y) => y.Nom.slice(2, -2)))]))

fetchTablePage.fetchAll = fetchAll
fetchTablePage.fetchByTitle = fetchByTitle

module.exports = fetchTablePage
