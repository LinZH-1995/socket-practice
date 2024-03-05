import { User } from './models/user.js'
import { publicChat } from './models/publicChat.js'
import { privateChat } from './models/privateChat.js'
import { formatTime } from './helpers/hbs-helper.js'

const onlineUser = new Map()

function onlyForHandshake (middleware) {
  return (req, res, next) => {
    console.log(req._query.sid)
    const isHandshake = req._query.sid === undefined
    if (isHandshake) {
      middleware(req, res, next)
    } else {
      next()
    }
  }
}

function socketSetting (io) {
  io.on('connection', async (socket) => {
    // const session = socket.request.session
    const currentUser = socket.request.user
    const currentUserId = currentUser?._id.toString()
    currentUser._id = currentUserId
    console.log('currentUser: ', currentUser)

    // 是否通過passport驗證，避免未登入者顯示在其他使用者畫面上
    if (currentUserId) {
      // 所有登入使用者自動加入'public'房間，與使用者ID的房間
      socket.join(['public', currentUserId])

      // 從DB拿資料，返回js物件非mongoose document，exec()回傳 real Promise 方便追蹤error
      const messages = await privateChat.find({ sender: currentUserId }).lean().exec() // 登入者發送過得所有訊息

      // 使用者存在並且onlineUser沒記錄使用者
      if (!onlineUser.has(currentUserId)) {
        // 將使用者加入onlineUser
        onlineUser.set(currentUserId, currentUser)
        // 通知public房間的所有客戶端'add onlineUser'事件，傳入user資料
        socket.to('public').emit('add onlineUser', { user: currentUser, messages })
      }
    }

    socket.on('add friend', async ({ friendId }) => {
      try {
        const isFriend = currentUser.friends.some(friend => friend.toString() === friendId)
        if (isFriend) throw new Error('已經是好友 !')

        const [friend, user] = await Promise.all([
          User.findById(friendId),
          User.findById(currentUserId)
        ])
        if (!friend) throw new Error('使用者不存在 !')

        friend.friends.push(user)
        user.friends.push(friend)
        await User.bulkSave([friend, user])

        io.to([currentUserId, friendId]).emit('remove add friend button', { senderId: currentUserId, receiverId: friendId })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('refresh unread messages', ({ senderId, receiverId }) => {
      io.to(senderId).emit('refresh unread messages', { senderId, receiverId })
    })

    socket.on('refresh unread messages immediately', async ({ msgId, senderId, receiverId }) => {
      try {
        const msg = await privateChat.findByIdAndUpdate(msgId, { unread: false }, { new: true })
        if (msg.unread) throw new Error('訊息更新失敗 !')
        io.to(senderId).emit('refresh unread messages', { senderId, receiverId })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('post public message', async ({ msg }) => {
      try {
        // 對public房間發送訊息
        const message = await publicChat.create({ content: msg, sender: currentUserId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm
        io.to('public').emit('add public message', {
          message: { ...message.toJSON(), createdAt: time }
        })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('post private message', async ({ msg, receiverId }) => {
      try {
        // 發送私人訊息
        const receiver = await User.findById(receiverId, '-password', { lean: true }).exec()
        if (!currentUser || !receiver) throw new Error('使用者不存在 !')

        const message = await privateChat.create({ content: msg, sender: currentUserId, receiver: receiverId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm

        // 對receiverId, sender所在房間各自發送更新訊息事件
        io.to([receiverId, currentUserId]).emit('add private message', {
          message: { ...message.toJSON(), createdAt: time },
          senderId: currentUserId,
          receiverId
        })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('add user public message notify', async () => {
      try {
        const user = await User.findByIdAndUpdate(currentUserId, { publicNotify: true }, { new: true, lean: true })
        if (!user) throw new Error('使用者不存在 !')
      } catch (error) {
        console.log(error)
      }
    })

    // 監聽'logout'事件，使用者登出時做甚麼
    socket.on('logout', () => {
      // 將使用者從onlineUser中移除
      if (onlineUser.delete(currentUserId)) {
        // 通知public房間的所有客戶端畫面移除此使用者
        io.to('public').emit('remove onlineUser', currentUserId)
      }

      // 使當前socket離線
      socket.disconnect()
      console.log(`user: ${currentUser.name} logout`)
    })

    // 監聽'disconnect'事件
    socket.on('disconnect', () => {
      console.log('socket:', socket.id, 'disconnected')
    })

    socket.on('disconnecting', () => {
      console.log('leave room: ', socket.rooms) // the Set contains at least the socket ID
    })
  })
}

export { onlineUser, onlyForHandshake, socketSetting }
