"use strict"

const POSITIVE_TEST_MANIFEST = 'Positive-tests.json'
const POSITIVE_PREFIXES_TEST_MANIFEST = 'Positive-prefixes-tests.json'

const Fs = require('fs')
const Path = require('path')
const Csv = require('jquery-csv')
const { DcTap } = require('../dctap');
const Base = new URL('http://a.example/test/dir/')

describe('jquery-csv interface', () => {
  JSON.parse(Fs.readFileSync(Path.join(__dirname, POSITIVE_TEST_MANIFEST), 'utf-8')).forEach(entry => {
    it(entry.name + ' JSON', async () => {
      const dctap = await parseDcTap(Path.join(__dirname, entry.csv), Base, {dontResolveIris: true})
      const ref = JSON.parse(Fs.readFileSync(Path.join(__dirname, entry.json), 'utf-8'))
      expect(dctap.toJson()).toEqual(ref)
    })
    it(entry.name + ' ShExJ', async () => {
      const dctap = await parseDcTap(Path.join(__dirname, entry.csv), Base, {dontResolveIris: true})
      const ref = JSON.parse(Fs.readFileSync(Path.join(__dirname, entry.shexj), 'utf-8'))
      expect(dctap.toShEx()).toEqual(ref)
    })
  })

  JSON.parse(Fs.readFileSync(Path.join(__dirname, POSITIVE_PREFIXES_TEST_MANIFEST), 'utf-8')).forEach(entry => {
    it(entry.name + ' JSON', async () => {
      const dctap = await parseDcTap(Path.join(__dirname, entry.csv), Base)
      const ref = JSON.parse(Fs.readFileSync(Path.join(__dirname, entry.json), 'utf-8'))
      expect(dctap.toJson()).toEqual(ref)
    })
    it(entry.name + ' ShExJ', async () => {
      const dctap = await parseDcTap(Path.join(__dirname, entry.csv), Base)
      const ref = JSON.parse(Fs.readFileSync(Path.join(__dirname, entry.shexj), 'utf-8'))
      expect(dctap.toShEx()).toEqual(ref)
    })
  })
})

async function parseDcTap (path, base, opts) {
  const dctap = new DcTap(opts)
  let text = Fs.readFileSync(path, 'utf-8')
  if (text.startsWith("\ufeff"))
    text = text.substr(1) // strip BOM
  return await new Promise((resolve, reject) => {
    Csv.toArrays(text, {}, (err, data) => {
      if (err) reject(err)
      dctap.parseRows(data, base)
      resolve(dctap)
    })
  })
}
