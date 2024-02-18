import { Router } from 'express'

import { homeRouter } from './modules/home.js'
import { messageRouter } from './modules/message.js'
import { passport } from '../config/passport.js'
import { authenticator } from '../middlewares/auth.js'
import { generalErrorHandler } from '../middlewares/errorHandler.js'
import { userController } from '../controllers/userController.js'

const router = Router()

router.use('/home', authenticator, homeRouter)
router.use('/messages', authenticator, messageRouter)

router.get('/logout', userController.logOut)

router.get('/signup', (req, res, next) => res.render('signup'))

router.post('/signup', userController.signUp)

router.get('/signin', (req, res, next) => {
  // 如已驗證通過轉回首頁
  if (req.isAuthenticated()) return res.redirect('/home')

  res.render('signin')
})

router.post('/signin', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/signin'
}))

router.get('/', (req, res, next) => res.redirect('/signin')) // root路由轉址登入路由

router.use(generalErrorHandler)

export { router }
