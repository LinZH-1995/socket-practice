import { Schema, mongoose } from '../config/mongoose.js'

const publicChatSchema = new Schema({
  content: {
    type: Array,
    required: true
  },

  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

const publicChat = mongoose.model('PublicChat', publicChatSchema)

export { publicChat }
