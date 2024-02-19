import { publicChat } from '../models/publicChat.js'

const homeService = {
  getHome: async (req, callback) => {
    try {
      const messages = await publicChat.find().lean().sort({ createdAt: 1 })
      callback(null, { messages, roomId: 'public' })
    } catch (error) {
      callback(error, null)
    }
  }
}

export { homeService }
