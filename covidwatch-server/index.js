const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const sha256 = require('js-sha256').sha256

const maxDepth = 10

const app = express()
const port = 3000
app.use(bodyParser.json())

mongoose.connect('mongodb://localhost/checkpoints', { useNewUrlParser: true })
const db = mongoose.connection

const checkpointSchema = new mongoose.Schema({
  key: String,
  links: [String],
  exposed: Boolean
})

const Checkpoint = mongoose.model('Checkpoint', checkpointSchema)

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
    key: sha256(String(Math.random())),
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
