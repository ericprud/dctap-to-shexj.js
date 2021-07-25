#!/usr/bin/env node

const Fs = require('fs')
const { DcTapToShExJ } = require('../dctap-to-shexj');

(async () => {
  const text = Fs.readFileSync(process.argv[2])
  const schema = await DcTapToShExJ(text, new URL('file://' + __dirname))
  console.log(JSON.stringify(schema, null, 2))
})()
