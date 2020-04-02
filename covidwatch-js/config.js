const oneDay = 1000 * 60 * 60 * 24
const safetyPeriod = 14 * oneDay
const estimatedDiagnosisDelay = 2 * oneDay
const serverBaseUrl = 'https://trackcovid.net/api/checkpoints'

module.exports = {
  safetyPeriod,
  estimatedDiagnosisDelay,
  serverBaseUrl
}
