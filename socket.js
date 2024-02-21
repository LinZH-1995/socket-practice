import { User } from './models/user.js'
import { publicChat } from './models/publicChat.js'
import { privateChat } from './models/privateChat.js'
import { formatTime } from './helpers/hbs-helper.js'

const onlineUser = new Map()

function socketSetting (io) {
  io.on('connection', async (socket) => {
    const session = socket.request.session
    const currentUserId = session.passport?.user

    // 是否通過passport驗證，避免未登入者顯示在其他使用者畫面上
    if (currentUserId) {
      // 所有登入使用者自動加入'public'房間，與使用者ID的房間
      socket.join(['public', currentUserId])
      console.log('in rooms: ', socket.rooms, 'this socketid: ', socket.id)

      const userId = session.passport.user
      // 從DB拿資料，不拿password欄位，返回js物件非mongoose document
      // exec()回傳 real Promise 方便追蹤error
      const [user, messages] = await Promise.all([
        User.findById(userId, '-password', { lean: true }).exec(),
        privateChat.find({ sender: userId }).lean().exec() // 登入者發送過得所有訊息
      ])

      // 使用者存在並且onlineUser沒記錄使用者
      if (user && !onlineUser.has(userId)) {
        // 將使用者加入onlineUser
        onlineUser.set(userId, { ...user, _id: user._id.toString() })
        // 通知public房間的所有客戶端'add onlineUser'事件，傳入user資料
        socket.to('public').emit('add onlineUser', { user, messages })
      }
    }

    socket.on('refresh unread messages', ({ userId }) => {})

    socket.on('post public message', async ({ msg, roomId, senderId }) => {
      try {
        // 對public房間發送訊息
        const message = await publicChat.create({ content: msg, sender: senderId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm
        io.to('public').emit('add public message', {
          message: { ...message.toJSON(), createdAt: time },
          senderId: currentUserId,
          roomId
        })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('post private message', async ({ msg, receiverId, senderId }) => {
      try {
        // 發送私人訊息
        const [sender, receiver] = await Promise.all([
          User.findById(senderId, '-password', { lean: true }).exec(),
          User.findById(receiverId, '-password', { lean: true }).exec()
        ])

        if (!sender || !receiver) throw new Error('使用者不存在 !')
        const message = await privateChat.create({ content: msg, sender: senderId, receiver: receiverId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm

        // 對receiverId, sender所在房間各自發送更新訊息事件
        io.to([receiverId, senderId]).emit('add private message', {
          message: { ...message.toJSON(), createdAt: time },
          senderId,
          receiverId
        })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('add user public message notify', async ({ currentUserId }) => {
      try {
        const user = await User.findByIdAndUpdate(currentUserId, { publicNotify: true }, { new: true, lean: true })
        if (!user) throw new Error('使用者不存在 !')
      } catch (error) {
        console.log(error)
      }
    })

    // 監聽'logout'事件，使用者登出時做甚麼
    socket.on('logout', async (userId) => {
      try {
        const id = session.passport?.user
        // 拿使用者資料，除id只拿name欄位
        const user = await User.findById(userId, 'name email', { lean: true })

        // 是否通過passport驗證，並且與傳入ID相同
        if (id && id === userId) {
          // 將使用者從onlineUser中移除
          if (onlineUser.delete(userId)) {
            // 通知public房間的所有客戶端畫面移除此使用者
            io.to('public').emit('remove onlineUser', userId)
          }

          // 使當前socket離線
          socket.disconnect()
          console.log(`user: ${user.name} logout`)
        }
      } catch (error) {
        console.log(error)
      }
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

export { onlineUser, socketSetting }
