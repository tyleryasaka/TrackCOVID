import React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import AddIcon from '@material-ui/icons/Add'
import HomeIcon from '@material-ui/icons/Home'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import StopIcon from '@material-ui/icons/Stop'
import PrintIcon from '@material-ui/icons/Print'
import QRCode from 'qrcode.react'
import QRReader from 'react-qr-reader'
import { Translation } from 'react-i18next'
import API from './api'
import {
  checkpointKeyLength
} from 'trackcovid-js/config'

const initialState = {
  mode: 'home',
  checkpointKey: null,
  checkpointTime: null,
  legacyMode: false
}

class Checkpoints extends React.Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
    const urlParams = new URLSearchParams(window.location.search)
    const checkpointKey = urlParams.get('checkpoint')
    if (checkpointKey) {
      if (checkpointKey.length === checkpointKeyLength) {
        try {
          API.joinCheckpoint(checkpointKey).then(checkpointObj => {
            this.setState({ mode: 'scan-success' })
            window.history.replaceState(null, null, window.location.pathname)
          })
        } catch (e) {
          console.error(e)
          this.setState({ mode: 'scan-error' })
          window.history.replaceState(null, null, window.location.pathname)
        }
      } else {
        this.setState({ mode: 'scan-error' })
        window.history.replaceState(null, null, window.location.pathname)
      }
    }
  }

  async reset () {
    this.setState(initialState)
  }

  async becomeHost () {
    try {
      const { key, time } = await API.hostCheckpoint()
      this.setState({
        mode: 'host',
        checkpointKey: key,
        checkpointTime: time
      })
    } catch (e) {
      console.error(e)
      window.alert('There was an unexpected error. Please leave feedback so the developer can fix this.')
    }
  }

  async endHost () {
    // TODO confirmation
    this.reset()
  }

  async joinCheckpoint () {
    this.setState({
      mode: 'join'
    })
  }

  async handleScan (data) {
    if (data) {
      if (data.length === checkpointKeyLength) {
        try {
          await API.joinCheckpoint(data)
          this.setState({ mode: 'scan-success' })
        } catch (e) {
          console.error(e)
          this.setState({ mode: 'scan-error' })
        }
      } else {
        // QR code may be a url
        const urlSplit = data.split('?checkpoint=')
        if ((urlSplit.length === 2) && (urlSplit[1].length === checkpointKeyLength)) {
          await API.joinCheckpoint(urlSplit[1])
          this.setState({ mode: 'scan-success' })
        } else {
          this.setState({ mode: 'scan-error' })
        }
      }
    }
  }

  handleScanError () {
    this.setState({ legacyMode: true })
  }

  openImageDialog () {
    this.refs.checkpointQR.openImageDialog()
  }

  render () {
    const { mode, checkpointKey, checkpointTime, legacyMode } = this.state
    const qrValue = `${window.location.href}?checkpoint=${checkpointKey}`
    let content
    if (mode === 'home') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <Typography style={{ marginTop: 25, marginBottom: 25 }}>
            <Translation>{t => t('welcomeMessage')}</Translation>
          </Typography>
          <Button onClick={this.becomeHost.bind(this)} variant='contained' color='secondary' aria-label='add' style={{ marginTop: 50 }}>
            <HomeIcon />
            <Translation>{t => t('hostCheckpointButton')}</Translation>
          </Button>
          <Button onClick={this.joinCheckpoint.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 50 }}>
            <AddIcon />
            <Translation>{t => t('joinCheckpointButton')}</Translation>
          </Button>
        </Grid>
      )
    } else if (mode === 'host') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <Typography style={{ marginTop: 25, marginBottom: 25 }}>
            <Translation>{t => t('hostingCheckpointMessage')}</Translation>
          </Typography>
          <QRCode value={qrValue} size={200} style={{ backgroundColor: '#fff', padding: 20 }} />
          <Button onClick={() => window.print()} variant='contained' color='secondary' aria-label='add' style={{ marginTop: 25 }}>
            <PrintIcon />
            <Translation>{t => t('printCheckpointButton')}</Translation>
          </Button>
          <Button onClick={this.endHost.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <StopIcon />
            <Translation>{t => t('endCheckpointButton')}</Translation>
          </Button>
          <Typography style={{ marginTop: 25 }}>
            <Translation>{t => t('checkpointCreatedMessage')}</Translation> {new Date(checkpointTime).toString()}
          </Typography>
        </Grid>
      )
    } else if (mode === 'join') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <QRReader
            ref='checkpointQR'
            delay={300}
            onError={this.handleScanError.bind(this)}
            onScan={this.handleScan.bind(this)}
            style={{ width: legacyMode ? 0 : '100%' }}
            facingMode='environment'
            legacyMode={legacyMode}
          />
          { legacyMode && (
            <Typography style={{ marginTop: 25 }}>
              <Translation>{t => t('noCameraPermissionMessage')}</Translation>
            </Typography>
          ) }
          <Button onClick={this.openImageDialog.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <Translation>{t => t('takePictureButton')}</Translation>
          </Button>
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            <Translation>{t => t('backButton')}</Translation>
          </Button>
        </Grid>
      )
    } else if (mode === 'scan-success') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <Typography style={{ marginTop: 25, marginBottom: 25 }}>
            <Translation>{t => t('joinSuccessfulMessage')}</Translation>
          </Typography>
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            <Translation>{t => t('backButton')}</Translation>
          </Button>
        </Grid>
      )
    } else if (mode === 'scan-error') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <Typography style={{ marginTop: 25, marginBottom: 25 }}>
            <Translation>{t => t('scanErrorMessage')}</Translation>
          </Typography>
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            <Translation>{t => t('backButton')}</Translation>
          </Button>
        </Grid>
      )
    }
    return content
  }
}

export default Checkpoints
