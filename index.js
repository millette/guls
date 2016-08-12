'use strict'

// npm
const got = require('got')
const RLP = require('rate-limit-promise')
const guls = require('nano')('http://localhost:5984/guls')

const doit = (db, data, cb) => {
  const yeah = data.subs.map((x) => {
    const search = x.title.toUpperCase()
    const redirected = x.redirects && x.redirects[0] && x.redirects[0].title.toUpperCase()
    let found
    data.main.rows.forEach((el) => {
      if (found) { return }
      const up = el.Nom.slice(2, -2).toUpperCase()
      if (search === up) {
        found = el
      } else if (redirected === up) {
        found = el
      }
    })
    if (found) { x.tableData = found }
    return x
  })

  const d2 = data.main
  delete d2.rows
  yeah.push(d2)

  db.bulk({
    docs: yeah.map((x) => {
      if (x.pageid) {
        x._id = `pageid:${x.pageid}:${x.lastrevid}`
      } else {
        x._id = `title:${x.title}`
      }
      return x
    })
  }, (e, ok) => {
    cb()
    console.log('E:', e)
    console.log('OK:', ok)
  })
}

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
    return Promise.all([Object.assign(x, d), got(`http://wiki.facil.qc.ca/api.php?format=json&action=parse&pageid=${pageids[0]}&prop=wikitext|categories|templates|revid`, { json: true })])
  })
  .then((x) => {
    if (x[1].body.parse.wikitext['*'].indexOf('#REDIRECT ')) {
      const ret = x[0]
      // ret.wikitext = x[1].body.parse.wikitext['*']
      x[1].body.parse.wikitext = x[1].body.parse.wikitext['*']
      return Object.assign(ret, x[1].body.parse)
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
        out.push({ error: 404, title: page })
        if (out.length === pages.length) { resolve(out) }
      })
  })
})

const fetchAll = (page, keepWikitext) => fetchTablePage(page, keepWikitext)
  .then((x) => Promise.all([x, wrk(x.rows.map((y) => y.Nom.slice(2, -2)))]))
  .then((x) => {
    return {
      main: x[0],
      subs: x[1]
    }
  })

const updateDb = (page, keepWikitext) => {
  const nop = () => { }
  const i = setInterval(nop, 300)
  fetchAll(page, keepWikitext)
    .then((x) => doit(guls, x, () => clearInterval(i)))
}

fetchAll.tablePage = fetchTablePage
fetchAll.byTitle = fetchByTitle
fetchAll.updateDb = updateDb

module.exports = fetchAll
