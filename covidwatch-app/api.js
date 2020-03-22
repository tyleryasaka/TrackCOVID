/* globals fetch */
import { AsyncStorage } from 'react-native'

const checkpointsDBKey = 'CHECKPOINTS'
const serverBaseUrl = 'https://covidwatch-server.herokuapp.com/checkpoints'

async function getCheckpoints () {
  const checkpointsString = await AsyncStorage.getItem(checkpointsDBKey) || '[]'
  return JSON.parse(checkpointsString)
}

async function setCheckpoints (checkpointsArr) {
  return AsyncStorage.setItem(checkpointsDBKey, JSON.stringify(checkpointsArr))
}

async function serverPOST (url = '', body) {
  const response = await fetch(`${serverBaseUrl}/${url}`, {
    method: 'POST',
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
    await serverPOST(`${checkpointKey}/links/${lastCheckpoint.key}`)
  }
  const checkpointObj = {
    key: checkpointKey,
    time: Date.now()
  }
  checkpoints.push(checkpointObj)
  await setCheckpoints(checkpoints)
  return checkpointObj
}

async function hostCheckpoint () {
  const newCheckpointKey = (await serverPOST()).checkpoint.key
  return addCheckpoint(newCheckpointKey)
}

function joinCheckpoint (checkpointKey) {
  return addCheckpoint(checkpointKey)
}

module.exports = {
  hostCheckpoint,
  joinCheckpoint
}
