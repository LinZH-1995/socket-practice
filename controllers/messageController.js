import { messageService } from '../services/messageService.js'

const messageController = {
  getMessagePage: (req, res, next) => {
    messageService.getMessagePage(req, (error, data) => { error ? next(error) : res.render('home', data) })
  }
}

export { messageController }
