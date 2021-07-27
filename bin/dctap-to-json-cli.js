#!/usr/bin/env node

const Fs = require('fs')
let Csv, StripBom
try {
  Csv = require('csv-parser')
  StripBom = require('strip-bom-stream')
} catch (e) {
  console.error('you need to `npm i csv-parser strip-bom-stream` to use CLI tools')
  process.exit(1)
}
const { DcTap } = require('../dctap');

(async () => {
  const dctap = new DcTap()
  const base = new URL('file://' + __dirname)
  Fs.createReadStream(process.argv[2])
    .pipe(StripBom())
    .pipe(Csv())
    .on('data', (data) => dctap.parseRow(data, base))
    .on('end', () => {
      console.log(JSON.stringify(dctap.toJson(), null, 2))
    })
})()
