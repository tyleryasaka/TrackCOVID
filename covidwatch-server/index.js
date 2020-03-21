const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose')
const sha256 = require('js-sha256').sha256

const app = express()
const port = 3000
app.use(bodyParser.json())

mongoose.connect('mongodb://localhost/checkpoints', { useNewUrlParser: true })
const db = mongoose.connection

const exposureSchema = new mongoose.Schema({
  data: String
})
const checkpointSchema = new mongoose.Schema({
  id: String,
  key: String,
  date: Date,
  exposures: [exposureSchema]
})

const Checkpoint = mongoose.model('Checkpoint', checkpointSchema)

app.post('/checkpoints', (req, res) => {
  const checkpoint = new Checkpoint({
    id: sha256(String(Math.random())),
    key: sha256(String(Math.random())),
    date: Date.now(),
    exposures: []
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

app.get('/checkpoints/:key', (req, res) => {
  const { key } = req.params
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      if (err) {
        console.error(err)
        res.send({ error: true })
      } else {
        res.send({ error: false, checkpoint })
      }
    }
  })
})

app.post('/checkpoints/:key/exposures', (req, res) => {
  const { key } = req.params
  const { data } = req.body
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      checkpoint.exposures.push({ data })
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
