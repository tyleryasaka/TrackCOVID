import React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import AddIcon from '@material-ui/icons/Add'
import HomeIcon from '@material-ui/icons/Home'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import StopIcon from '@material-ui/icons/Stop'
import QRCode from 'qrcode.react'
import QRReader from 'react-qr-reader'
import API from './api'
import {
  checkpointKeyLength
} from 'covidwatch-js/config'

const initialState = {
  mode: 'home',
  checkpointKey: null,
  checkpointTime: null
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
    this.setState({ mode: 'scan-error' })
  }

  render () {
    const { mode, checkpointKey, checkpointTime } = this.state
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
            Welcome to TrackCOVID. To participate in the effort to track the spread of the SARS-COV-2 virus, please host or join a checkpoint whenever you interact with others in a way that could transmit the virus.
          </Typography>
          <Button onClick={this.becomeHost.bind(this)} variant='contained' color='secondary' aria-label='add' style={{ marginTop: 50 }}>
            <HomeIcon />
            Host a Checkpoint
          </Button>
          <Button onClick={this.joinCheckpoint.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 50 }}>
            <AddIcon />
            Join a Checkpoint
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
            You are now hosting a checkpoint. Others may join using the QR code below.
          </Typography>
          <QRCode value={qrValue} size={200} style={{ backgroundColor: '#fff', padding: 20 }} />
          <Button onClick={this.endHost.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <StopIcon />
            End checkpoint
          </Button>
          <Typography style={{ marginTop: 25 }}>
            Checkpoint created {new Date(checkpointTime).toString()}
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
            delay={300}
            onError={this.handleScanError.bind(this)}
            onScan={this.handleScan.bind(this)}
            style={{ width: '100%' }}
            facingMode='environment'
          />
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            Back
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
            You have joined the checkpoint successfully.
          </Typography>
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            Back
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
            The QR code could not be read. Please try again.
          </Typography>
          <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <ArrowBackIcon />
            Back
          </Button>
        </Grid>
      )
    }
    return content
  }
}

export default Checkpoints
