'use strict'
import test from 'ava'
import fn from './'

test('byTitle, normal', async t => {
  const result = await fn.byTitle('Communauté WordPress Montréal')
  t.is(result.pageid, 555)
})

test('byTitle, redir', async t => {
  const result = await fn.byTitle('Montreal WordPress Community')
  t.is(result.pageid, 555)
})

test('byTitle, nope', async t => await t.throws(fn.byTitle('Mon666treal WordPress Community'), 'Not found.'))

/*
fn.tablePage() === fetchTablePage()
fn.updateDb() === updateDb()
fn() === fetchAll()
*/
