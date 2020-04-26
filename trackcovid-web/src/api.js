import TrackCovid from 'trackcovid-js'
import {
  safetyPeriod,
  estimatedDiagnosisDelay,
  exposureWindow,
  checkpointKeyLength,
  serverBaseUrl as defaultServerBaseUrl
} from 'trackcovid-js/config'

const checkpointsDBKey = 'CHECKPOINTS'
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

const trackCovid = TrackCovid({
  serverBaseUrl,
  safetyPeriod,
  estimatedDiagnosisDelay,
  getCheckpoints,
  setCheckpoints,
  exposureWindow,
  checkpointKeyLength
})

const {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  exportCheckpoints
} = trackCovid

export default {
  hostCheckpoint,
  joinCheckpoint,
  getExposureStatus,
  exportCheckpoints
}
