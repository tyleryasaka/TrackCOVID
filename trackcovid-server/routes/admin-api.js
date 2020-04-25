const express = require('express')
const sha256 = require('js-sha256').sha256
const passport = require('passport')
const Confirmcode = require('../models/confirmcode')

const confirmcodeLength = Number(process.env['CONFIRMCODE_LENGTH'])

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
adminApiRouter.get('/confirmation-code', ensureAuthenticated, function (req, res) {
  res.sendfile('admin/confirmation-code.html')
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

adminApiRouter.post('/confirmcode/generate', ensureAuthenticated, (req, res) => {
  const confirmcode = new Confirmcode({
    code: sha256(String(Math.random())).substring(0, confirmcodeLength),
    redeemed: false
  })
  confirmcode.save(function (err, confirmcode) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      res.redirect(`/admin/confirmation-code?code=${confirmcode.code}`)
    }
  })
})

module.exports = adminApiRouter
