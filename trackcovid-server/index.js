require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const passport = require('passport')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const session = require('cookie-session')
const Logger = require('r7insight_node')
const morgan = require('morgan')
const apiRouter = require('./routes/api')
const adminApiRouter = require('./routes/admin-api')
const storefrontApiRouter = require('./routes/storefront-api')
const User = require('./models/user')

const app = express()
const port = process.env.PORT || 8000

const logToken = process.env['LOG_TOKEN']
if (logToken) {
  const logger = new Logger({ token: logToken, region: 'us' })

  const logStream = {
    write: function (message, encoding) {
      logger.info(message.replace('\n', ''))
    }
  }
  app.use(morgan('dev', { stream: logStream }))
}

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', process.env['WEB_CLIENT_DOMAIN'])
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// https redirect
if (process.env['REDIRECT_HTTPS'] === 'true') {
  app.enable('trust proxy')
  app.use(function (req, res, next) {
    if (req.secure) {
      next()
    } else {
      res.redirect('https://' + req.headers.host + req.url)
    }
  })
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ keys: [process.env.SESSION_KEY] }))
app.use(flash())
app.use('/api/', apiRouter)
app.use('/checkpoint/', storefrontApiRouter)
app.use('/public/', express.static('landing-public'))
app.use('/app/static', express.static('app-public/static'))

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
app.use('/admin/', adminApiRouter)

app.get('/', function (req, res) {
  res.sendfile('app-public/index.html')
})

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Connected to mongodb...')
  app.listen(port, () => console.log(`Listening on port ${port}...`))
})
