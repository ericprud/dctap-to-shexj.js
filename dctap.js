"use strict"

class DcTap {

  shapes = []
  curShape = null
  conjuncts = null
  headers = ["shapeID", "shapeLabel", "propertyID", "propertyLabel", "mandatory", "repeatable", "valueNodeType", "valueDataType", "valueConstraint", "valueConstraintType", "valueShape", "note"]

  parseRows (rows, base) {
    if (rows[0][0] === this.headers[0]
        && rows[0][0] === this.headers[0]
        && rows[0][0] === this.headers[0])
      rows.shift() // skip apparent header row
    rows.forEach((row) => this.parseRow(row, base))
    return this
  }

  parseRow (row, base) {
    if (Array.isArray(row)) {
      row = this.headers.reduce((acc, header, idx) => {
        acc[header] = row[idx]
        return acc
      }, {})
    }

    row.valueNodeType = row.valueNodeType.toLowerCase()
    row.valueConstraintType = row.valueConstraintType.toLowerCase()

    if (row.shapeID) {
      this.curShape = {
        type: "Shape",
        shapeID: new URL(row.shapeID, base).href,
        tripleConstraints: [],
      }
      this.shapes.push(this.curShape)
    } else if (!this.curShape) {
      throw new Error(`no current shape into which to add ${JSON.stringify(row)}`)
    }
    this.curShape.tripleConstraints.push(toTC(row, base))
    return this
  }

  toJson () {
    return this.shapes
  }

  toShEx () {
    const schema = {
      type: "Schema",
      shapes: this.shapes.map(sh => ({
        type: "Shape",
        id: sh.shapeID,
        expression: maybeAnd(sh.tripleConstraints.map(tc => Object.assign(
          {
            type: "TripleConstraint",
            predicate: tc.propertyID,
          },
          tc.mandatory ? { min: 1 } : {},
          tc.repeatable ? { max: -1 } : {},
          shexValueExpr(tc),
        )), "EachOf", "expressions")
      }))
    }
    return schema
  }
}

function shexValueExpr (tc) {
  const valueExprs = []
  if (tc.values)
    valueExprs.push({
      type: "NodeConstraint",
      values: tc.values
    })
  if (tc.pattern)
    valueExprs.push({
      type: "NodeConstraint",
      pattern: tc.pattern
    })
  if (tc.valueShape)
    valueExprs.push(tc.valueShape)
  const valueExpr = maybeAnd(valueExprs, "ShapeAnd", "shapeExprs")
  return valueExpr ? { valueExpr } : {}
}

function toTC (sc, base) {
  return Object.assign(
    {
      propertyID: sc.propertyID,
    },
    sc.mandatory ? { mandatory: true } : {},
    sc.repeatable ? { repeatable: true } : {},
    parseValueConstraint(sc, base),
    sc.valueShape ? { valueShape: new URL(sc.valueShape, base).href } : {},
  )
}

function parseValueConstraint (sc, base) {
  switch (sc.valueConstraintType) {
  case "iristem":
  case "picklist":
  case "languagetag":
    const values = sc.valueConstraint.split(/\s+/)
    return {
      values: values.map(v => coerseV(v, sc, sc.valueConstraintType.endsWith('stem')))
    }
  case "pattern":
    return {
      pattern: sc.valueConstraint
    }
  case "":
    return {} // no valueConstraint property
  default: throw Error(`What's a valueConstraintType ${sc.valueConstraintType} in ${JSON.stringify(sc, null, 2)}?`)
  }
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

module.exports = { DcTap }
