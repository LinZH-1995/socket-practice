import { userService } from '../services/userService.js'

const userController = {
  signUp: (req, res, next) => {
    userService.signUp(req, (error, data) => { error ? next(error) : res.redirect('/signin') })
  },

  logOut: (req, res, next) => {
    userService.logOut(req, (error, data) => { error ? next(error) : res.redirect('/signin') })
  }
}

export { userController }
