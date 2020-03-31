/* globals fetch */

function CovidWatch (config) {
  const {
    serverBaseUrl,
    safetyPeriod,
    estimatedDiagnosisDelay,
    getCheckpoints,
    setCheckpoints,
    getUseConfirmed,
    setUseConfirmed
  } = config

  async function serverRequest (method, url = '', body) {
    const response = await fetch(`${serverBaseUrl}/${url}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    return response.json()
  }

  async function addCheckpoint (checkpointKey) {
    const checkpoints = await getCheckpoints()
    if (checkpoints.length > 0) {
      const lastCheckpoint = checkpoints[checkpoints.length - 1]
      await serverRequest('POST', `links/${checkpointKey}/${lastCheckpoint.key}`)
    }
    const checkpointObj = {
      key: checkpointKey,
      time: Date.now()
    }
    checkpoints.push(checkpointObj)
    await setCheckpoints(checkpoints)
    return checkpointObj
  }

  async function getCheckpointStatus (checkpointKey) {
    const response = (await serverRequest('GET', `${checkpointKey}`))
    const useConfirmed = await getUseConfirmed()
    const riskLevelProp = useConfirmed ? 'confirmedRiskLevel' : 'riskLevel'
    return !response.error && (response[riskLevelProp] === 'elevated')
  }

  async function hostCheckpoint () {
    const newCheckpointKey = (await serverRequest('POST')).checkpoint
    return addCheckpoint(newCheckpointKey)
  }

  function joinCheckpoint (checkpointKey) {
    return addCheckpoint(checkpointKey)
  }

  async function getExposureStatus () {
    const checkpoints = await getCheckpoints()
    const recentCheckpoints = checkpoints.filter(checkpoint => {
      return Date.now() - checkpoint.time <= safetyPeriod
    })
    const statuses = await Promise.all(recentCheckpoints.map(checkpoint => {
      return getCheckpointStatus(checkpoint.key)
    }))
    return statuses.some(status => status)
  }

  async function reportPositive (confirmcode) {
    const checkpoints = await getCheckpoints()
    const recentCheckpoints = checkpoints.filter(checkpoint => {
      return Date.now() - checkpoint.time <= estimatedDiagnosisDelay
    })
    const checkpointKeys = recentCheckpoints.map(({ key }) => key)
    await serverRequest('POST', 'exposures', {
      keys: checkpointKeys,
      confirmcode
    })
  }

  return {
    hostCheckpoint,
    joinCheckpoint,
    getExposureStatus,
    reportPositive,
    getUseConfirmed,
    setUseConfirmed
  }
}

module.exports = CovidWatch
