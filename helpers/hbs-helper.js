import dayjs from 'dayjs'

function ifCond (a, b, options) {
  return a?.toString() === b?.toString() ? options.fn(this) : options.inverse(this)
}

function formatTime (time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function isFriend (currentUserfriendsId, userId, options) {
  const result = currentUserfriendsId.some(friendId => friendId.toString() === userId)
  return result ? options.fn(this) : options.inverse(this)
}

export { ifCond, formatTime, isFriend }
