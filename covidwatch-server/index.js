require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const sha256 = require('js-sha256').sha256
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const session = require('cookie-session')

const maxDepth = 100

const app = express()
const port = process.env.PORT || 3000
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ keys: [process.env.SESSION_KEY] }))
app.use(flash())
app.use('/admin/', express.static('admin-public'))

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/checkpoints', { useNewUrlParser: true })
const db = mongoose.connection

const checkpointSchema = new mongoose.Schema({
  key: String,
  links: [String],
  exposed: Boolean
})
const userSchema = new mongoose.Schema({})
const confirmcodeSchema = new mongoose.Schema({
  code: String,
  redeemed: Boolean
})
userSchema.plugin(passportLocalMongoose)

const Checkpoint = mongoose.model('Checkpoint', checkpointSchema)
const User = mongoose.model('User', userSchema)
const Confirmcode = mongoose.model('Confirmcode', confirmcodeSchema)

// Uncomment and run this file once to generate an admin user
// const newUsername = 'user'
// const newPass = 'pass'
// const newUser = new User({ username: newUsername })
// User.register(newUser, newPass, function () {
//   console.log(`Registered user ${newUsername}`)
// })

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

async function findExposures (checkpointKey, depth) {
  return new Promise(function (resolve) {
    Checkpoint.findOne({ key: checkpointKey }, async function (err, checkpoint) {
      if (err) {
        resolve({ error: true, exposures: [] })
      } else {
        const exposures = []
        let err = false
        if (checkpoint.exposed) {
          exposures.push(0)
        }
        if (depth >= 1) {
          await Promise.all(checkpoint.links.map((link) => {
            const promise = findExposures(link, depth - 1)
            return promise.then(result => {
              result.exposures.forEach((exposureDistance) => {
                exposures.push(exposureDistance + 1)
              })
              err = err || result.error
            })
          }))
        }
        resolve({ error: err, exposures })
      }
    })
  })
}

app.post('/api/admin/login', passport.authenticate('local', { failureRedirect: '/admin/login.html', failureFlash: true }), function (req, res) {
  res.redirect('/admin/dashboard.html')
})

app.get('/api/admin/logout', function (req, res) {
  req.logout()
  res.redirect('/admin/login.html')
})

app.get('/api/admin/status', function (req, res) {
  res.send({ isLoggedIn: Boolean(req.user) })
})

app.post('/api/admin/confirmcode/generate', passport.authenticate('local', { failureRedirect: '/admin/login.html' }), (req, res) => {
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

app.post('/checkpoints', (req, res) => {
  const checkpoint = new Checkpoint({
    key: sha256(String(Math.random())).substring(0, 32),
    links: [],
    exposed: false
  })
  checkpoint.save(function (err, checkpoint) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      res.send({ error: false, checkpoint })
    }
  })
})

app.get('/checkpoints/:key/:depth', (req, res) => {
  const { key, depth } = req.params
  const safeDepth = Math.max(Math.min(Number(depth), maxDepth), 0)
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err || !checkpoint) {
      console.error(err)
      res.send({ error: true })
    } else {
      const promise = findExposures(checkpoint.key, safeDepth)
      promise.then(result => {
        res.send({ error: result.error, exposures: result.exposures })
      })
    }
  })
})

app.post('/checkpoints/:key/exposure', (req, res) => {
  const { key } = req.params
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err || !checkpoint) {
      console.error(err)
      res.send({ error: true })
    } else {
      checkpoint.exposed = true
      checkpoint.save(function (err, checkpoint) {
        if (err) {
          console.error(err)
          res.send({ error: true })
        } else {
          res.send({ error: false })
        }
      })
    }
  })
})

app.post('/checkpoints/:key/links/:target', (req, res) => {
  const { key, target } = req.params
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err || !checkpoint) {
      console.error(err)
      res.send({ error: true })
    } else {
      if (!checkpoint.links.includes(target)) {
        checkpoint.links.push(target)
      }
      checkpoint.save(function (err, checkpoint) {
        if (err) {
          console.error(err)
          res.send({ error: true })
        } else {
          res.send({ error: false })
        }
      })
    }
  })
})

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Connected to mongodb...')
  app.listen(port, () => console.log(`Listening on port ${port}...`))
})
