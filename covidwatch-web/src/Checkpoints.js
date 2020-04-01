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
import StatusAlert from './StatusAlert'
import API from './api'

const initialState = {
  mode: 'home',
  checkpointKey: null,
  checkpointTime: null,
  scanned: false,
  joinError: false
}

class Checkpoints extends React.Component {
  constructor () {
    super()
    this.state = initialState
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
        this.setState({ scanned: true })
      } else {
        this.setState({ scanned: true, joinError: true })
      }
    }
  }

  handleScanError () {
    this.setState({ scanned: true, joinError: true })
  }

  render () {
    const { mode, checkpointKey, checkpointTime, joinError, scanned } = this.state
    const { status } = this.props
    let content
    if (mode === 'home') {
      content = (
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
        >
          <StatusAlert status={status} />
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
      if (!scanned) {
        content = joinError
          ? (
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
          : (
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
      } else {
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
      }
    }
    return content
  }
}

export default Checkpoints
