#!/usr/bin/env node

const Fs = require('fs')
const { DcTap } = require('../dctap');

(async () => {
  const text = Fs.readFileSync(process.argv[2])
  const dctap = new DcTap()
  await dctap.parse(text, new URL('file://' + __dirname))
  const schema = dctap.toShEx()
  console.log(JSON.stringify(schema, null, 2))
})()
