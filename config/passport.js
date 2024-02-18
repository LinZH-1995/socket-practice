import bcrypt from 'bcryptjs'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import { User } from '../models/user.js'

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email }, null, { lean: true })
    if (!user) return done(null, false, { message: 'Email 尚未註冊 !' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return done(null, false, { message: '帳號或密碼錯誤！' })

    done(null, user)
  } catch (error) {
    done(error, null)
  }
}))

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id, '-password', { lean: true }) // exclude password field and call lean()
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export { passport }
