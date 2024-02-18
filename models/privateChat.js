import { Schema, mongoose } from '../config/mongoose.js'

const privateChatSchema = new Schema({
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

  receiver: {
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

const privateChat = mongoose.model('PrivateChat', privateChatSchema)

export { privateChat }
