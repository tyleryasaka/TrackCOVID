import React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import QRReader from 'react-qr-reader'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ReportProblemIcon from '@material-ui/icons/ReportProblem'
import CropFreeIcon from '@material-ui/icons/CropFree'
import theme from './theme'
import API from './api'
import {
  confirmcodeLength
} from 'covidwatch-js/config'

const initialState = {
  exposureStatus: false,
  loaded: false,
  showReportConfirmation: false,
  confirmcode: undefined,
  mode: 'default'
}

class Exposures extends React.Component {
  constructor () {
    super()
    this.state = initialState
  }

  async reset () {
    this.setState(initialState)
  }

  showReportPrompt () {
    this.setState({ mode: 'report-prompt' })
  }

  exitReportPrompt () {
    this.setState({ mode: 'default' })
  }

  scanConfirmcode () {
    this.setState({ mode: 'scan-confirmcode' })
  }

  async handleScan (data) {
    if (data) {
      if (data.length === confirmcodeLength) {
        this.setState({ confirmcode: data })
        this.reportConfirmation()
      } else {
        this.setState({ mode: 'scan-error' })
      }
    }
  }

  handleScanError () {
    this.setState({ mode: 'scan-error' })
  }

  reportConfirmation () {
    this.setState({ showReportConfirmation: true })
  }

  async reportPositive (data) {
    // TODO prompt for confirmation
    await API.reportPositive(data)
    this.setState({ mode: 'report-done', showReportConfirmation: false })
  }

  render () {
    const { status, statusLoaded } = this.props
    const { mode, showReportConfirmation } = this.state
    const statusMessageLoading = 'Loading your status...'
    const statusMessageNegative = 'No transmission paths from infected individuals to you have been discovered at this time. However, everyone is at risk and individuals should follow the directives of the CDC as well as local, state, and federal governments.'
    const statusMessagePositive = 'A possible transmission path from an infected individual to you has been discovered. You should take precautionary measures to protect yourself and others, according to the directives of the CDC  as well as local, state, and federal governments.'
    const riskLevelLoading = 'Loading...'
    const riskLevelNegative = 'standard'
    const riskLevelPositive = 'elevated'
    const statusMessage = statusLoaded
      ? (status
        ? statusMessagePositive
        : statusMessageNegative)
      : statusMessageLoading
    const riskLevel = statusLoaded
      ? (status
        ? riskLevelPositive
        : riskLevelNegative)
      : riskLevelLoading
    const riskLevelColor = status
      ? 'error'
      : 'primary'
    return (
      <Grid
        container
      >
        {
          ((mode === 'default') && (
            <Grid
              container
              direction='column'
              justify='center'
              alignItems='center'
            >
              <Typography style={{ marginTop: 25 }}>
                Your risk level: <span style={{ color: theme.palette[riskLevelColor].main }}>{riskLevel}</span>
              </Typography>
              <Typography style={{ marginTop: 15 }}>
                {statusMessage}
              </Typography>
              <Typography style={{ marginTop: 25 }}>
                If you or someone you have been in close contact with have received a positive test, you may report it using the button below. This will warn those who may have been exposed of their increased risk. You will remain anonymous.
              </Typography>
              <Button onClick={this.showReportPrompt.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ReportProblemIcon />
                Anonymous Report
              </Button>
            </Grid>
          )) || ((mode === 'report-prompt') && (
            <Grid
              container
              direction='column'
              justify='center'
              alignItems='center'
            >
              <Typography style={{ marginTop: 25 }}>
                Do you have a confirmation code to scan? Scanning a confirmation code will help those that may have been exposed, by letting them know that this is a legitimate risk.
              </Typography>
              <Button onClick={this.scanConfirmcode.bind(this)} variant='contained' color='secondary' aria-label='add' style={{ marginTop: 50 }}>
                <CropFreeIcon />
                Scan confirmation code
              </Button>
              <Button onClick={this.reportConfirmation.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 50 }}>
                I don't have a code
              </Button>
            </Grid>
          )) || ((mode === 'scan-confirmcode') && (
            <Grid
              container
              direction='column'
              justify='center'
              alignItems='center'
            >
              {!showReportConfirmation && (
                <QRReader
                  delay={300}
                  onError={this.handleScanError.bind(this)}
                  onScan={this.handleScan.bind(this)}
                  style={{ width: '100%' }}
                  facingMode='environment'
                />
              )}
              <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ArrowBackIcon />
                Back
              </Button>
            </Grid>
          )) || ((mode === 'scan-error') && (
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
          )) || ((mode === 'report-done') && (
            <Grid
              container
              direction='column'
              justify='center'
              alignItems='center'
            >
              <Typography style={{ marginTop: 25, marginBottom: 25 }}>
                Your positive status was reported anonymously. Those at risk will be notified. Thank you.
              </Typography>
              <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ArrowBackIcon />
                Back
              </Button>
            </Grid>
          ))
        }
        <Dialog
          open={showReportConfirmation}
          disableBackdropClick
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>Report positive status?</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              This will notify those that may have been exposed of their increased risk. You will remain anonymous. This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.reset.bind(this)} color='secondary'>
              Never mind
            </Button>
            <Button onClick={this.reportPositive.bind(this)} color='primary' autoFocus>
              Report now
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    )
  }
}

export default Exposures
