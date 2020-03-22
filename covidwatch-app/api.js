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

async function hostCheckpoint () {
  const newCheckpoint = (await serverPOST()).checkpoint
  const checkpoints = await getCheckpoints()
  if (checkpoints.length > 0) {
    const lastCheckpoint = checkpoints[checkpoints.length - 1]
    await serverPOST(`${newCheckpoint.key}/links/${lastCheckpoint.key}`)
  }
  const checkpointObj = {
    key: newCheckpoint.key,
    time: Date.now()
  }
  checkpoints.push(checkpointObj)
  await setCheckpoints(checkpoints)
  return checkpointObj
}

async function joinCheckpoint (checkpointKey) {
  console.log(checkpointKey)
}

module.exports = {
  hostCheckpoint,
  joinCheckpoint
}
