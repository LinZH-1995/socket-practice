import { User } from '../models/user.js'
import { publicChat } from '../models/publicChat.js'

const homeService = {
  getHome: async (req, callback) => {
    try {
      const userId = req.user._id
      const [user, messages] = await Promise.all([
        // 進入public房間，將 publicNotify 改為false，new = true 返回更新後的資料
        User.findByIdAndUpdate(userId, { publicNotify: false }, { new: true, lean: true }).exec(),
        publicChat.find().lean().sort({ createdAt: 1 }).exec()
      ])
      // messsages可以為空，使用者不可
      if (!user) throw new Error('使用者不存在 !')

      callback(null, { user, messages, roomId: 'public' })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { homeService }
