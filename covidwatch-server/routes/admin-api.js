const express = require('express')
const sha256 = require('js-sha256').sha256
const passport = require('passport')
const Confirmcode = require('../models/confirmcode')

const adminApiRouter = express.Router()

function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/admin/login.html')
  }
}

adminApiRouter.get('/', function (req, res) {
  res.redirect('/admin/dashboard.html')
})

adminApiRouter.post('/login', passport.authenticate('local', { failureRedirect: '/admin/login.html' }), function (req, res) {
  res.redirect('/admin/dashboard.html')
})

adminApiRouter.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/admin/login.html')
})

adminApiRouter.get('/status', function (req, res) {
  res.send({ isLoggedIn: req.isAuthenticated() })
})

adminApiRouter.post('/confirmcode/generate', ensureAuthenticated, (req, res) => {
  const confirmcode = new Confirmcode({
    code: sha256(String(Math.random())).substring(0, 32),
    redeemed: false
  })
  confirmcode.save(function (err, confirmcode) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      res.redirect(`/admin/confirmation-code.html?code=${confirmcode.code}`)
    }
  })
})

module.exports = adminApiRouter
