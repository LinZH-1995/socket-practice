import { Router } from 'express'

import { messageController } from '../../controllers/messageController.js'

const messageRouter = Router()

messageRouter.get('/t/:id', messageController.getMessagePage)

export { messageRouter }
