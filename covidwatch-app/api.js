/* globals fetch */
import { AsyncStorage } from 'react-native'

const checkpointsDBKey = 'CHECKPOINTS'
const useConfirmedDBKey = 'USECONFIRMED'
const serverBaseUrl = 'https://covidwatch-server.herokuapp.com/api/checkpoints'
const oneDay = 1000 * 60 * 60 * 24
const safetyPeriod = 14 * oneDay
const estimatedDiagnosisDelay = 2 * oneDay

async function getCheckpoints () {
  const checkpointsString = await AsyncStorage.getItem(checkpointsDBKey) || '[]'
  return JSON.parse(checkpointsString)
}

async function setCheckpoints (checkpointsArr) {
  return AsyncStorage.setItem(checkpointsDBKey, JSON.stringify(checkpointsArr))
}

async function getUseConfirmed () {
  const useConfirmedString = await AsyncStorage.getItem(useConfirmedDBKey) || 'false'
  return JSON.parse(useConfirmedString)
}

async function setUseConfirmed (newVal) {
  return AsyncStorage.setItem(useConfirmedDBKey, JSON.stringify(newVal))
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

async function reportPositive () {
  const checkpoints = await getCheckpoints()
  const recentCheckpoints = checkpoints.filter(checkpoint => {
    return Date.now() - checkpoint.time <= estimatedDiagnosisDelay
  })
  await Promise.all(recentCheckpoints.map(checkpoint => {
    return serverRequest('POST', `exposures/${checkpoint.key}`)
  }))
}

module.exports = {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  reportPositive,
  setUseConfirmed
}
