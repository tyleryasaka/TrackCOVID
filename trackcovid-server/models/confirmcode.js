const mongoose = require('mongoose')

const confirmcodeSchema = new mongoose.Schema({
  code: String,
  redeemed: Boolean
})

const Confirmcode = mongoose.model('Confirmcode', confirmcodeSchema)

module.exports = Confirmcode
