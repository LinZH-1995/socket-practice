import { User } from '../models/user.js'
import { publicChat } from '../models/publicChat.js'
import { privateChat } from '../models/privateChat.js'

const homeService = {
  getHome: async (req, callback) => {
    try {
      const userId = req.user._id
      const [user, messages, unreadMessages] = await Promise.all([
        // 進入public房間，將 publicNotify 改為false，new = true 返回更新後的資料
        User.findByIdAndUpdate(userId, { publicNotify: false }, { new: true, lean: true }).exec(),
        publicChat.find().lean().sort({ createdAt: 1 }).exec(),
        privateChat.aggregate([
          { $match: { receiver: userId, unread: true } },
          { $group: { _id: '$sender', count: { $count: {} } } },
          { $sort: { _id: 1 } }
        ])
      ])
      // messsages可以為空，使用者不可
      if (!user) throw new Error('使用者不存在 !')

      // 有未讀私人訊息
      if (unreadMessages.length !== 0) {
        req.user.friends.forEach(friend => {
          const unreadUser = unreadMessages.find(msg => msg._id.toString() === friend._id.toString())
          if (unreadUser) friend.unreadCount = unreadUser.count
        })
      }

      callback(null, { user, messages, roomId: 'public' })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { homeService }
