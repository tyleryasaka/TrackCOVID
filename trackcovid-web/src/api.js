import TrackCovid from 'trackcovid-js'
import {
  safetyPeriod,
  estimatedDiagnosisDelay,
  serverBaseUrl as defaultServerBaseUrl
} from 'trackcovid-js/config'

const checkpointsDBKey = 'CHECKPOINTS'
const useConfirmedDBKey = 'USECONFIRMED'
const serverBaseUrl = (process.env['REACT_APP_ENV'] === 'development')
  ? 'http://localhost:8000/api/checkpoints'
  : defaultServerBaseUrl

function getCheckpoints () {
  const localStorage = window.localStorage
  const checkpointsString = localStorage.getItem(checkpointsDBKey) || '[]'
  return Promise.resolve(JSON.parse(checkpointsString))
}

function setCheckpoints (checkpointsArr) {
  const localStorage = window.localStorage
  return Promise.resolve(localStorage.setItem(checkpointsDBKey, JSON.stringify(checkpointsArr)))
}

async function getUseConfirmed () {
  const localStorage = window.localStorage
  const useConfirmedString = localStorage.getItem(useConfirmedDBKey) || 'false'
  return Promise.resolve(JSON.parse(useConfirmedString))
}

async function setUseConfirmed (newVal) {
  const localStorage = window.localStorage
  return Promise.resolve(localStorage.setItem(useConfirmedDBKey, JSON.stringify(newVal)))
}

const trackCovid = TrackCovid({
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
} = trackCovid

export default {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  reportPositive,
  getUseConfirmed,
  setUseConfirmed
}
