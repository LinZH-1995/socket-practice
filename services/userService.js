import bcrypt from 'bcryptjs'

import { User } from '../models/user.js'

const userService = {
  signUp: async (req, callback) => {
    try {
      const name = req.body.name.trim()
      const email = req.body.email.trim()
      const password = req.body.password.trim()
      const passwordCheck = req.body.passwordCheck.trim()
      if (!name || !email || !password || !passwordCheck) throw new Error('所有欄位都是必填!')

      const pwd = await bcrypt.hash(password, 10)
      const user = await User.create({ name, email, password: pwd })

      callback(null, user)
    } catch (error) {
      callback(error, null)
    }
  },

  logOut: (req, callback) => {
    req.logout(function (error) {
      if (error) return callback(error, null)
      callback(null, null)
    })
  }
}

export { userService }
