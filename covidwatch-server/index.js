require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const passport = require('passport')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const session = require('cookie-session')
const apiRouter = require('./routes/api')
const adminApiRouter = require('./routes/admin-api')
const storefrontApiRouter = require('./routes/storefront-api')
const User = require('./models/user')

const app = express()
const port = process.env.PORT || 8000

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', process.env['WEB_CLIENT_DOMAIN'])
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ keys: [process.env.SESSION_KEY] }))
app.use(flash())
app.use('/api/', apiRouter)
app.use('/storefront-api/', storefrontApiRouter)
app.use('/admin/', express.static('admin-public'))
app.use('/public/', express.static('landing-public'))

app.get('/', function (req, res) {
  res.sendfile('landing-public/index.html')
})

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/checkpoints', { useNewUrlParser: true })
const db = mongoose.connection

// Uncomment and run this file once to generate an admin user
// const newUsername = 'user'
// const newPass = 'pass'
// const newUser = new User({ username: newUsername })
// User.register(newUser, newPass, function () {
//   console.log(`Registered user ${newUsername}`)
// })

app.use(passport.initialize())
app.use(passport.session())
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.get('/admin', function (req, res) {
  res.redirect('/admin/dashboard.html')
})
app.use('/admin-api/', adminApiRouter)

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Connected to mongodb...')
  app.listen(port, () => console.log(`Listening on port ${port}...`))
})
