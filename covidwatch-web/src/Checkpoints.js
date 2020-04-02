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
      if (checkpointKey.length === 32) {
        API.joinCheckpoint(checkpointKey).then(checkpointObj => {
          if (!checkpointObj) {
            this.setState({ mode: 'scan-error' })
          } else {
            this.setState({ mode: 'scan-success' })
          }
          window.history.replaceState(null, null, window.location.pathname)
        })
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
    const { key, time } = await API.hostCheckpoint()
    this.setState({
      mode: 'host',
      checkpointKey: key,
      checkpointTime: time
    })
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
      if (data.length === 32) {
        await API.joinCheckpoint(data)
        this.setState({ mode: 'scan-succes' })
      } else {
        this.setState({ mode: 'scan-error' })
      }
    }
  }

  handleScanError () {
    this.setState({ mode: 'scan-error' })
  }

  render () {
    const { mode, checkpointKey, checkpointTime } = this.state
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
          <QRCode value={checkpointKey} />
          <Typography style={{ marginTop: 25 }}>
            Checkpoint created {new Date(checkpointTime).toString()}
          </Typography>
          <Button onClick={this.endHost.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
            <StopIcon />
            End checkpoint
          </Button>
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
