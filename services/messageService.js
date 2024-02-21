import { User } from '../models/user.js'
import { privateChat } from '../models/privateChat.js'

const messageService = {
  getMessagePage: async (req, callback) => {
    try {
      const currentUserId = req.user._id // me
      const id = req.params.id // user who i wish to talk

      const [user, updateResopnse] = await Promise.all([
        User.findById(id, '-password', { lean: true }).exec(),
        privateChat.updateMany({ sender: id, receiver: currentUserId }, { unread: false })
      ])

      if (!user || !updateResopnse.acknowledged) throw new Error('使用者不存在 / 更新失敗 !')
      // 拿出更新後的資料
      const messages = await privateChat.find({
        $or: [
          { sender: currentUserId, receiver: id },
          { sender: id, receiver: currentUserId }
        ]
      }).lean().sort({ createdAt: 1 }).exec()

      callback(null, { roomId: id, roomName: user.name, messages })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { messageService }
