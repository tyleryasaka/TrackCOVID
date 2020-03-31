import { AsyncStorage } from 'react-native'
const CovidWatch = require('covidwatch-js')
const {
  safetyPeriod,
  estimatedDiagnosisDelay,
  serverBaseUrl
} = require('covidwatch-js/config')

const checkpointsDBKey = 'CHECKPOINTS'
const useConfirmedDBKey = 'USECONFIRMED'

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

const covidWatch = CovidWatch({
  serverBaseUrl,
  safetyPeriod,
  estimatedDiagnosisDelay,
  getCheckpoints,
  setCheckpoints,
  getUseConfirmed,
  setUseConfirmed
})

const {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  reportPositive
} = covidWatch

module.exports = {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  reportPositive,
  getUseConfirmed,
  setUseConfirmed
}
