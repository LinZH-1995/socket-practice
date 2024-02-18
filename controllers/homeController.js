import { homeService } from '../services/homeService.js'

const homeController = {
  getHome: (req, res, next) => {
    homeService.getHome(req, (error, data) => { error ? next(error) : res.render('home', data) })
  }
}

export { homeController }
