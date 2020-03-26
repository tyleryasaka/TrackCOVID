/* globals fetch */
import { AsyncStorage } from 'react-native'

const checkpointsDBKey = 'CHECKPOINTS'
const serverBaseUrl = 'https://covidwatch-server.herokuapp.com/checkpoints'
const depth = 3

async function getCheckpoints () {
  const checkpointsString = await AsyncStorage.getItem(checkpointsDBKey) || '[]'
  return JSON.parse(checkpointsString)
}

async function setCheckpoints (checkpointsArr) {
  return AsyncStorage.setItem(checkpointsDBKey, JSON.stringify(checkpointsArr))
}

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
    await serverRequest('POST', `${checkpointKey}/links/${lastCheckpoint.key}`)
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
  const response = (await serverRequest('GET', `${checkpointKey}/${depth}`))
  return !response.error && response.exposures.length > 0
}

async function hostCheckpoint () {
  const newCheckpointKey = (await serverRequest('POST')).checkpoint.key
  return addCheckpoint(newCheckpointKey)
}

function joinCheckpoint (checkpointKey) {
  return addCheckpoint(checkpointKey)
}

async function getExposureStatus () {
  const twoWeeksAgo = Date.now() - 604800000
  const checkpoints = await getCheckpoints()
  const recentCheckpoints = checkpoints.filter(checkpoint => {
    return checkpoint.time > twoWeeksAgo
  })
  const statuses = await Promise.all(recentCheckpoints.map(checkpoint => {
    return getCheckpointStatus(checkpoint.key)
  }))
  return statuses.some(status => status)
}

async function reportPositive () {
  const twoWeeksAgo = Date.now() - 604800000
  const checkpoints = await getCheckpoints()
  const recentCheckpoints = checkpoints.filter(checkpoint => {
    return checkpoint.time > twoWeeksAgo
  })
  await Promise.all(recentCheckpoints.map(checkpoint => {
    return serverRequest('POST', `${checkpoint.key}/exposure`)
  }))
}

module.exports = {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  reportPositive
}
