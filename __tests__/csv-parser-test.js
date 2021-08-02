"use strict"

const MANIFEST_PATH = 'Positive-tests.json'

const Fs = require('fs')
const Path = require('path')
const Csv = require('csv-parser')
const StripBom = require('strip-bom-stream')
const { DcTap } = require('../dctap');
const Base = new URL('http://a.example/test/dir/')

const Manifest = JSON.parse(Fs.readFileSync(Path.join(__dirname, MANIFEST_PATH), 'utf-8'))

describe('csv-parser interface', () => {
  Manifest.forEach(entry => {
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

async function parseDcTap (path, base) {
    const dctap = new DcTap({dontResolveIris: true})
    return await new Promise((resolve, reject) => {
      Fs.createReadStream(path)
        .pipe(StripBom())
        .pipe(Csv())
        .on('data', (data) => {dctap.parseRow(data, base);})
        .on('end', () => {resolve(dctap)})
    })
}
