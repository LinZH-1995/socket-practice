import { User } from '../models/user.js'
import { privateChat } from '../models/privateChat.js'

const messageService = {
  getMessagePage: async (req, callback) => {
    try {
      const currentUserId = req.user._id // me
      const id = req.params.id // user who i wish to talk

      const [user, messages] = await Promise.all([
        User.findById(id, '-password', { lean: true }).exec(),
        privateChat.find({
          $or: [
            { sender: currentUserId, receiver: id },
            { sender: id, receiver: currentUserId }
          ]
        }).lean().sort({ createdAt: 1 }).exec()
      ])

      console.log('id: ', id, 'cur: ', currentUserId, '||||', user, messages)
      callback(null, { roomId: id, roomName: user.name, messages })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { messageService }
