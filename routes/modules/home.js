import { Router } from 'express'

import { homeController } from '../../controllers/homeController.js'

const homeRouter = Router()

homeRouter.get('/', homeController.getHome)

export { homeRouter }
