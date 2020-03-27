require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const sha256 = require('js-sha256').sha256
const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs')
const bcrypt = require('bcrypt')

const maxDepth = 100

AdminBro.registerAdapter(require('admin-bro-mongoose'))
const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())

const checkpointSchema = new mongoose.Schema({
  key: String,
  links: [String],
  exposed: Boolean
})
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  encryptedPassword: { type: String, required: true },
  role: { type: String, enum: ['admin', 'restricted'], required: true }
})
const Checkpoint = mongoose.model('Checkpoint', checkpointSchema)
const User = mongoose.model('User', userSchema)

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/checkpoints', { useNewUrlParser: true })
const db = mongoose.connection

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

const adminBro = new AdminBro({
  branding: {
    companyName: 'COVID Watch P2P Server Admin',
    softwareBrothers: false,
    logo: false
  },
  resources: [
    {
      resource: User,
      options: {
        parent: null,
        properties: {
          encryptedPassword: {
            isVisible: false
          },
          password: {
            type: 'string',
            isVisible: {
              list: false, edit: true, filter: false, show: false
            }
          },
          role: {
            type: 'string',
            isVisible: {
              list: true, edit: true, filter: true, show: true
            }
          }
        },
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
            before: async (request) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                  password: undefined
                }
              }
              return request
            }
          },
          edit: {
            isAccessible: ({ currentAdmin, record }) => currentAdmin && (currentAdmin.role === 'admin' || currentAdmin._id === record.param('_id')),
            before: async (request) => {
              console.log(request)
              const currentRole = request.session.adminUser.role
              const newRole = (currentRole === 'restricted') ? 'restricted' : request.payload.role
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                  password: undefined,
                  role: newRole
                }
              }
              return request
            }
          },
          delete: {
            isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin'
          }
        }
      }
    }
  ],
  rootPath: '/admin'
})
const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  authenticate: async (email, password) => {
    const user = await User.findOne({ email })
    if (user) {
      const matched = await bcrypt.compare(password, user.encryptedPassword)
      if (matched) {
        return user
      }
    }
    return false
  },
  cookiePassword: process.env['COOKIE_PASSWORD']
})
app.use(adminBro.options.rootPath, router)

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Connected to mongodb...')
  app.listen(port, () => console.log(`Listening on port ${port}...`))
})
