"use strict"

const MANIFEST_PATH = 'Negative-tests.json'

const Fs = require('fs')
const Path = require('path')
const Csv = require('jquery-csv')
const { DcTap } = require('../dctap');
const Base = new URL('http://a.example/test/dir/')

const Manifest = JSON.parse(Fs.readFileSync(Path.join(__dirname, MANIFEST_PATH), 'utf-8'))

describe('negative tests', () => {
  Manifest.forEach(entry => {
    it(entry.name + ' JSON', async () => {
      await expect(parseDcTap(Path.join(__dirname, entry.csv), Base))
        .rejects
        .toThrow(new RegExp(entry.error));
    })
  })
})

async function parseDcTap (path, base) {
  const dctap = new DcTap()
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
