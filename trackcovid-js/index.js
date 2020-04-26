/* globals fetch */
const sha256 = require('js-sha256').sha256

function TrackCovid (config) {
  const {
    serverBaseUrl,
    safetyPeriod,
    estimatedDiagnosisDelay,
    getCheckpoints,
    setCheckpoints,
    exposureWindow,
    checkpointKeyLength
  } = config

  const oneHour = 1000 * 60 * 60

  async function serverRequest (method, url = '', body) {
    const response = await fetch(`${serverBaseUrl}/${url}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const responseJSON = response.json()
    if (responseJSON.error) {
      throw new Error(`request-failed: ${serverBaseUrl}/${url}`)
    }
    return responseJSON
  }

  async function addCheckpoint (checkpointKey) {
    const checkpoints = await getCheckpoints()
    const checkpointObj = {
      key: checkpointKey,
      timestamp: Date.now()
    }
    checkpoints.push(checkpointObj)
    await setCheckpoints(checkpoints)
    return checkpointObj
  }

  async function hostCheckpoint () {
    const newCheckpointKey = sha256(String(Math.random())).substring(0, checkpointKeyLength)
    return addCheckpoint(newCheckpointKey)
  }

  function joinCheckpoint (checkpointKey) {
    return addCheckpoint(checkpointKey)
  }

  async function exportCheckpoints () {
    const visitedCheckpoints = await getCheckpoints()
    const recentCheckpoints = visitedCheckpoints.filter(checkpoint => {
      return (Date.now() - checkpoint.timestamp) <= estimatedDiagnosisDelay
    })
    return recentCheckpoints
  }

  async function getExposureStatus () {
    const visitedCheckpoints = await getCheckpoints()
    const recentCheckpoints = visitedCheckpoints.filter(checkpoint => {
      return Date.now() - checkpoint.timestamp <= safetyPeriod
    })
    const response = await serverRequest('GET')
    const exposedCheckpoints = response.error ? [] : response.checkpoints
    const matches = recentCheckpoints.filter(visited => {
      return exposedCheckpoints.filter(exposed => {
        return (
          (visited.key === exposed.key) &&
          (visited.timestamp >= (exposed.timestamp - oneHour)) &&
          (visited.timestamp - exposed.timestamp <= exposureWindow)
        )
      }).length > 0
    })
    return matches.length > 0
  }

  return {
    hostCheckpoint,
    joinCheckpoint,
    getExposureStatus,
    exportCheckpoints
  }
}

module.exports = TrackCovid
