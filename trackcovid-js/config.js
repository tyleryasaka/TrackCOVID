const oneDay = 1000 * 60 * 60 * 24
const safetyPeriod = 14 * oneDay
const estimatedDiagnosisDelay = 2 * oneDay
const serverBaseUrl = '/api/checkpoints'
const checkpointKeyLength = 16
const confirmcodeLength = 20

module.exports = {
  safetyPeriod,
  estimatedDiagnosisDelay,
  serverBaseUrl,
  checkpointKeyLength,
  confirmcodeLength
}
