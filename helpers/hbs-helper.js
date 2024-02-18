import dayjs from 'dayjs'

function ifCond (a, b, options) {
  return a.toString() === b.toString() ? options.fn(this) : options.inverse(this)
}

function formatTime (time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

export { ifCond, formatTime }
