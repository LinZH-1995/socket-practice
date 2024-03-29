// Packages
import express from 'express'
import methodOverrirde from 'method-override'
import expressSession from 'express-session'
import connectMongoDBSession from 'connect-mongodb-session'
import { engine } from 'express-handlebars'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

// Folders
import { router } from './routes/index.js'
import { ifCond, formatTime, isFriend } from './helpers/hbs-helper.js'
import { passport } from './config/passport.js'
import { socketSetting, onlyForHandshake, onlineUser } from './socket.js'

// Variables
const app = express() // 建立express app
const server = createServer(app) // 建立http server instance 帶入 express app

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }
})

const MongoDBStore = connectMongoDBSession(expressSession)
const sessionStore = new MongoDBStore({
  uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/socket-practice-db',
  collection: 'mySessions',
  expires: 1200000
})
const sessionMiddleware = expressSession({
  name: 'MY_SESSION',
  secret: 'abcdefg',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1200000 },
  rolling: true,
  store: sessionStore
})

// Settings
app.engine('hbs', engine({ defaultLayout: 'main', extname: '.hbs', helpers: { ifCond, formatTime, isFriend } }))
app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use(methodOverrirde('_method'))
app.use(express.urlencoded({ extended: true }))
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

io.engine.use(onlyForHandshake(sessionMiddleware))
io.engine.use(onlyForHandshake(passport.session()))
io.engine.use(
  onlyForHandshake((req, res, next) => {
    if (req.user) {
      next()
    } else {
      res.writeHead(401)
      res.end()
    }
  })
)

socketSetting(io, sessionStore)

app.use((req, res, next) => {
  // views所需資料放進res.locals
  res.locals.isAuthenticated = req.isAuthenticated()
  res.locals.user = req.user
  res.locals.userFriends = req.user?.friends
  res.locals.onlineUser = [...onlineUser.values()]
  next()
})

app.use('/', router) // 使用 express app路由

// server 監聽 3000 port
server.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
