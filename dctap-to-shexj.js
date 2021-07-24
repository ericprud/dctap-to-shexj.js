"use strict"

const Csv = require('csv-parser')
const Fs = require('fs')
const { Readable } = require("stream")

parseCSV(process.argv[2])

function parseCSV (file) {

  const dctap = []
  Fs.createReadStream(file)
    .pipe(Csv(), {bom: false})
    .on('data', (data) => dctap.push(data))
    .on('end', () => {
      const schema = dctapToShExJ(dctap, new URL('http://a.example/ns/toy'))
      console.log(JSON.stringify(schema, null, 2))
    })
}

function dctapToShExJ (dctap, base) {

  const schema = { type: "Schema", shapes: [] }
  let curShape = null
  let conjuncts = null
  dctap.forEach( (row) => {

    // bom:false doesn't seem to work so strip BOM from all keys:
    Object.keys(row).forEach(key => {
      if (key.startsWith("\ufeff")) {
        const newKey = key.substr(1)
        row[newKey] = row[key]
        delete row[key]
      }
    })
    // or maybe it's just the first column:
    // if ("\ufeffshapeID" in row) {
    //   row.shapeID = row["\ufeffshapeID"]
    //   delete row["\ufeffshapeID"]
    // }

    row.valueNodeType = row.valueNodeType.toLowerCase()
    row.valueConstraintType = row.valueConstraintType.toLowerCase()

    const {
      shapeID,
      shapeLabel,
      propertyID,
      propertyLabel,
      mandatory,
      repeatable,
      valueNodeType,
      valueDataType,
      valueConstraint,
      valueConstraintType,
      valueShape,
      note,
    } = row

    if (shapeID) {
      if (curShape) {
        curShape.expression = maybeAnd(conjuncts, "EachOf", "expressions")
      }
      conjuncts = []
      curShape = {
        type: "Shape",
        id: new URL(shapeID, base).href,
      }
      schema.shapes.push(curShape)
    } else if (!curShape) {
      throw new Error(`no current shape into which to add ${JSON.stringify(row)}`)
    }
    conjuncts.push(toTC(row))
  })
  if (curShape) {
    curShape.expression = maybeAnd(conjuncts, "EachOf", "expressions")
  }
  return schema

  function toTC (sc) {
    return {
      type: "TripleConstraint",
      predicate: sc.propertyID,
      valueExpr: parseExpr(sc)
    }
  }

  function parseExpr (sc) {
    const valueExprs = []

    switch (sc.valueConstraintType) {
    case "iristem":
    case "picklist":
    case "languagetag":
      const values = sc.valueConstraint.split(/\s+/)
      valueExprs.push({
        type: "NodeConstraint",
        values: values.map(v => coerseV(v, sc, sc.valueConstraintType.endsWith('stem')))
      })
      break
    case "pattern":
      valueExprs.push({
        type: "NodeConstraint",
        pattern: sc.valueConstraint
      })
      break
    case "":
      break
    default: throw Error(`What's a valueConstraintType ${sc.valueConstraintType} in ${JSON.stringify(sc, null, 2)}?`)
    }
    if (sc.valueShape)
      valueExprs.push(new URL(sc.valueShape, base).href)
    return maybeAnd(valueExprs, "ShapeAnd", "shapeExprs")
  }

  function coerseV (v, sc, isStem = false) {
    if (sc.valueConstraintType === "languagetag")
      return {
        type: "Language",
        languageTag: v
      }

    switch (sc.valueNodeType) {
    case "literal":
      const ret = isStem
        ? {
          type: "LiteralStem",
          value: v
        }
      : {
        value: v
      }
      if (sc.valueDataType && sc.valueDataType !== "xsd:string")
        ret.datatype = sc.valueDataType
      return ret
    case "iri":
      return isStem
        ? {
          type: "IriStem",
          stem: v
        }
      : v
    case "":
      return {
        value: v
      }
    default: throw Error(`What's a valueNodeType=${sc.valueNodeType} in ${JSON.stringify(sc, null, 2)}?`)
    }
  }

  function maybeAnd (conjuncts, type, property) {
    if (conjuncts.length === 0)
      return  undefined

    if (conjuncts.length === 1)
    return conjuncts[0]

    const ret = { type }
    ret[property] = conjuncts
    return ret
  }

}
