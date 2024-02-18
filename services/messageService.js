import { User } from '../models/user.js'

const messageService = {
  getMessagePage: async (req, callback) => {
    try {
      const id = req.params.id
      const user = await User.findById(id, '-password', { lean: true })
      console.log('id: ', id, user)
      callback(null, { roomId: id, roomName: user.name })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { messageService }
