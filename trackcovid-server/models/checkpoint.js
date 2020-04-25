const mongoose = require('mongoose')

const checkpointSchema = new mongoose.Schema({
  key: String,
  links: [String],
  exposed: Boolean,
  confirmedExposed: Boolean
})

const Checkpoint = mongoose.model('Checkpoint', checkpointSchema)

module.exports = Checkpoint
