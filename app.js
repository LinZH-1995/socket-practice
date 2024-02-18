// Packages
import express from 'express'
import methodOverrirde from 'method-override'
import expressSession from 'express-session'
import { engine } from 'express-handlebars'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

// Folders
import { router } from './routes/index.js'
import { ifCond, formatTime } from './helpers/hbs-helper.js'
import { passport } from './config/passport.js'
import { User } from './models/user.js'
import { publicChat } from './models/publicChat.js'
import { privateChat } from './models/privateChat.js'

// Variables
const app = express() // 建立express app
const server = createServer(app) // 建立http server instance 帶入 express app
const io = new Server(server)
const onlineUser = new Map()
const sessionMiddleware = expressSession({
  name: 'MY_SESSION',
  secret: 'abcdefg',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1200000 }
})

app.engine('hbs', engine({ defaultLayout: 'main', extname: '.hbs', helpers: { ifCond, formatTime } }))
app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use(methodOverrirde('_method'))
app.use(express.urlencoded({ extended: true }))
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
io.engine.use(sessionMiddleware)

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
    const user = await User.findById(userId, '-password', { lean: true })

    // 使用者存在並且onlineUser沒記錄使用者
    if (user && !onlineUser.has(userId)) {
      // 將使用者加入onlineUser
      onlineUser.set(userId, { ...user, _id: user._id.toString() })
      // 通知public房間的所有客戶端'add onlineUser'事件，傳入user資料
      socket.to('public').emit('add onlineUser', user)
    }
  }

  socket.on('post message', async ({ msg, roomId, senderId }) => {
    try {
      if (roomId === 'public') {
        // 對public房間發送訊息
        const message = await publicChat.create({ content: msg, sender: senderId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm
        io.to('public').emit('add public message', {
          message: { ...message.toJSON(), createdAt: time },
          senderId: currentUserId,
          roomId
        })
      }

      if (roomId !== 'public') {
        // 發送私人訊息
        const receiverId = roomId // 訊息接收者
        const [sender, receiver] = await Promise.all([
          User.findById(senderId, '-password', { lean: true }),
          User.findById(receiverId, '-password', { lean: true })
        ])

        if (!sender || !receiver) throw new Error('使用者不存在 !')
        const message = await privateChat.create({ content: msg, sender: senderId, receiver: receiverId })
        const time = formatTime(message.createdAt) // format time YYYY-MM-DD HH:mm

        // 對receiverId, sender所在房間各自發送更新訊息事件
        io.to([receiverId, senderId]).emit('add private message', {
          message: { ...message.toJSON(), createdAt: time },
          senderId,
          roomId
        })
      }
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
        // onlineUser有記錄使用者
        if (onlineUser.has(userId)) {
          // 將使用者從onlineUser中移除
          onlineUser.delete(userId)
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

app.use((req, res, next) => {
  // views所需資料放進res.locals
  res.locals.isAuthenticated = req.isAuthenticated()
  res.locals.user = req.user
  res.locals.onlineUser = [...onlineUser.values()]
  next()
})

app.use('/', router) // 使用 express app路由

// server 監聽 3000 port
server.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
