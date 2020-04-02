const express = require('express')
const sha256 = require('js-sha256').sha256
const Checkpoint = require('../models/checkpoint')
const Confirmcode = require('../models/confirmcode')

const maxDepth = Number(process.env['MAX_DEPTH'])
const checkpointKeyLength = Number(process.env['CHECKPOINT_KEY_LENGTH'])

const apiRouter = express.Router()

async function findExposures (checkpointKey, depth) {
  return new Promise(function (resolve) {
    Checkpoint.findOne({ key: checkpointKey }, async function (err, checkpoint) {
      if (err || !checkpoint) {
        resolve({ error: true, exposures: [] })
      } else {
        let elevatedRisk = false
        let confirmedElevatedRisk = false
        let err = false
        if (checkpoint.exposed) {
          elevatedRisk = true
        }
        if (checkpoint.confirmedExposed) {
          confirmedElevatedRisk = true
        }
        if (depth >= 1) {
          await Promise.all(checkpoint.links.map((link) => {
            const promise = findExposures(link, depth - 1)
            return promise.then(result => {
              elevatedRisk = elevatedRisk || result.elevatedRisk
              confirmedElevatedRisk = confirmedElevatedRisk || result.confirmedElevatedRisk
              err = err || result.error
            })
          }))
        }
        resolve({ error: err, elevatedRisk, confirmedElevatedRisk })
      }
    })
  })
}

function markExposed (key, isConfirmed) {
  return new Promise(function (resolve) {
    Checkpoint.findOne({ key }, function (err, checkpoint) {
      if (err || !checkpoint) {
        console.error(err)
        resolve({ error: true })
      } else {
        checkpoint.exposed = true
        checkpoint.confirmedExposed = isConfirmed
        checkpoint.save(function (err, checkpoint) {
          if (err) {
            console.error(err)
            resolve({ error: true })
          } else {
            resolve({ error: false })
          }
        })
      }
    })
  })
}

async function checkConfirmcode (code) {
  return new Promise(function (resolve) {
    Confirmcode.findOne({ code }, function (err, confirmcode) {
      if (err || !confirmcode) {
        resolve(false)
      } else {
        const isValid = !confirmcode.redeemed
        if (isValid) {
          confirmcode.redeemed = true
          confirmcode.save(function (err) {
            if (err) {
              console.error(err)
              resolve(false)
            } else {
              resolve(true)
            }
          })
        } else {
          resolve(false)
        }
      }
    })
  })
}

apiRouter.post('/checkpoints', (req, res) => {
  const checkpoint = new Checkpoint({
    key: sha256(String(Math.random())).substring(0, checkpointKeyLength),
    links: [],
    exposed: false
  })
  checkpoint.save(function (err, checkpoint) {
    if (err) {
      console.error(err)
      res.send({ error: true })
    } else {
      res.send({ error: false, checkpoint: checkpoint.key })
    }
  })
})

apiRouter.get('/checkpoints/:key', (req, res) => {
  const { key } = req.params
  Checkpoint.findOne({ key }, function (err, checkpoint) {
    if (err || !checkpoint) {
      if (err) {
        console.error(err)
      }
      res.send({ error: true })
    } else {
      const promise = findExposures(checkpoint.key, maxDepth)
      promise.then(result => {
        res.send({
          error: result.error,
          riskLevel: result.elevatedRisk ? 'elevated' : 'standard',
          confirmedRiskLevel: result.confirmedElevatedRisk ? 'elevated' : 'standard'
        })
      })
    }
  })
})

apiRouter.post('/checkpoints/exposures', async (req, res) => {
  const { keys, confirmcode } = req.body
  const isConfirmed = confirmcode && await checkConfirmcode(confirmcode)
  const results = await Promise.all(keys.map(key => markExposed(key, isConfirmed)))
  const hasError = results.some(({ error }) => error)
  res.send({ error: hasError })
})

apiRouter.post('/checkpoints/links/:key/:target', (req, res) => {
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

module.exports = apiRouter
