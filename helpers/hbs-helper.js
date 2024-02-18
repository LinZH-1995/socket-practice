function ifCond (a, b, options) {
  console.log('----------', a.toString(), b.toString())
  return a.toString() === b.toString() ? options.fn(this) : options.inverse(this)
}

export { ifCond }
