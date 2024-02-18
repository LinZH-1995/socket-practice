function generalErrorHandler (err, req, res, next) {
  if (err) console.log(err)
  res.redirect('back')
  next()
}

export { generalErrorHandler }
