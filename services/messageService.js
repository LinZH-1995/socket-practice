import { User } from '../models/user.js'
import { privateChat } from '../models/privateChat.js'
import { onlineUser } from '../socket.js'

const messageService = {
  getMessagePage: async (req, callback) => {
    try {
      const currentUserId = req.user._id // me
      const id = req.params.id // user who i wish to talk
      const userFriends = req.user.friends

      const [user, updateResopnse] = await Promise.all([
        User.findById(id, '-password', { lean: true }).exec(),
        privateChat.updateMany({ sender: id, receiver: currentUserId }, { unread: false })
      ])

      if (!user || !updateResopnse.acknowledged) throw new Error('使用者不存在 / 更新失敗 !')
      // 拿出更新後的資料
      const [messages, unreadMessages] = await Promise.all([
        privateChat.find({
          $or: [
            { sender: currentUserId, receiver: id },
            { sender: id, receiver: currentUserId }
          ]
        }).lean().sort({ createdAt: 1 }).exec(),
        privateChat.aggregate([
          { $match: { receiver: currentUserId, unread: true } },
          { $group: { _id: '$sender', count: { $count: {} } } },
          { $sort: { _id: 1 } }
        ])
      ])

      // 有未讀私人訊息
      if (unreadMessages.length !== 0) {
        userFriends.forEach(friend => {
          const unreadUser = unreadMessages.find(msg => msg._id.toString() === friend._id.toString())
          if (unreadUser) friend.unreadCount = unreadUser.count
        })
      }

      userFriends.forEach(friend => { friend.isOnline = onlineUser.has(friend._id.toString()) })

      callback(null, { roomId: id, roomName: user.name, messages })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { messageService }
