const express = require('express')
const passport = require('passport')
const Checkpoint = require('../models/checkpoint')

const adminApiRouter = express.Router()

function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/admin')
  }
}

adminApiRouter.use('/public/', express.static('admin/static'))
adminApiRouter.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    res.sendfile('admin/dashboard.html')
  } else {
    res.sendfile('admin/login.html')
  }
})

adminApiRouter.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/admin')
})

adminApiRouter.post('/login', passport.authenticate('local', { failureRedirect: '/admin' }), function (req, res) {
  res.redirect('/admin')
})

adminApiRouter.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/admin')
})

adminApiRouter.get('/status', function (req, res) {
  res.send({ isLoggedIn: req.isAuthenticated() })
})

adminApiRouter.post('/checkpoints', ensureAuthenticated, (req, res) => {
  const { checkpoints } = req.body
  const checkpointsForDb = checkpoints.map(checkpoint => {
    return { key: checkpoint.key, timestamp: checkpoint.timestamp }
  })
  Checkpoint.create(checkpointsForDb, function (err, checkpoints) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      res.send({ error: false })
    }
  })
})

module.exports = adminApiRouter
