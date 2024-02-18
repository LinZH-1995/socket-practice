function authenticator (req, res, next) {
  if (req.isAuthenticated()) return next()

  res.redirect('/signin')
}

export { authenticator }
