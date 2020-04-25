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
import { Translation } from 'react-i18next'
import theme from './theme'
import API from './api'
import {
  confirmcodeLength
} from 'trackcovid-js/config'

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

  componentDidMount () {
    const urlParams = new URLSearchParams(window.location.search)
    const confirmcode = urlParams.get('confirm')
    if (confirmcode) {
      if (confirmcode.length === confirmcodeLength) {
        this.setState({ confirmcode })
        window.history.replaceState(null, null, window.location.pathname)
        this.reportConfirmation()
      } else {
        this.setState({ mode: 'scan-error' })
        window.history.replaceState(null, null, window.location.pathname)
      }
    }
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
        // QR code may be a url
        const urlSplit = data.split('?confirm=')
        if ((urlSplit.length === 2) && (urlSplit[1].length === confirmcodeLength)) {
          this.setState({ confirmcode: urlSplit[1] })
          this.reportConfirmation()
        } else {
          this.setState({ mode: 'scan-error' })
        }
      }
    }
  }

  handleScanError () {
    this.setState({ mode: 'scan-error' })
  }

  reportConfirmation () {
    this.setState({ showReportConfirmation: true })
  }

  async reportPositive () {
    const { confirmcode } = this.state
    try {
      await API.reportPositive(confirmcode)
      this.setState({ mode: 'report-done', showReportConfirmation: false })
    } catch (e) {
      console.error(e)
      this.reset()
      window.alert('There was an unexpected error. Please leave feedback so the developer can fix this.')
    }
  }

  render () {
    const { status, statusLoaded } = this.props
    const { mode, showReportConfirmation } = this.state
    const statusMessageLoading = (<Translation>{t => t('statusLoadingMessage')}</Translation>)
    const statusMessageNegative = (<Translation>{t => t('statusNegativeMessage')}</Translation>)
    const statusMessagePositive = (<Translation>{t => t('statusPositiveMessage')}</Translation>)
    const riskLevelLoading = (<Translation>{t => t('statusLoadingMessage')}</Translation>)
    const riskLevelNegative = (<Translation>{t => t('standardRiskLevelMessage')}</Translation>)
    const riskLevelPositive = (<Translation>{t => t('elevatedRiskLevelMessage')}</Translation>)
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
                <Translation>{t => t('yourRiskLevelMessage')}</Translation>: <span style={{ color: theme.palette[riskLevelColor].main }}>{riskLevel}</span>
              </Typography>
              <Typography style={{ marginTop: 15 }}>
                {statusMessage}
              </Typography>
              <Typography style={{ marginTop: 25 }}>
                <Translation>{t => t('aboutReportMessage')}</Translation>
              </Typography>
              <Button onClick={this.showReportPrompt.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ReportProblemIcon />
                <Translation>{t => t('reportButton')}</Translation>
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
                <Translation>{t => t('aboutConfirmationCodeMessage')}</Translation>
              </Typography>
              <Button onClick={this.scanConfirmcode.bind(this)} variant='contained' color='secondary' aria-label='add' style={{ marginTop: 50 }}>
                <CropFreeIcon />
                <Translation>{t => t('scanConfirmationCodeButton')}</Translation>
              </Button>
              <Button onClick={this.reportConfirmation.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 50 }}>
                <Translation>{t => t('scanWithoutConfirmationCodeButton')}</Translation>
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
                <Translation>{t => t('backButton')}</Translation>
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
                <Translation>{t => t('scanErrorMessage')}</Translation>
              </Typography>
              <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ArrowBackIcon />
                <Translation>{t => t('backButton')}</Translation>
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
                <Translation>{t => t('reportCompletedMessage')}</Translation>
              </Typography>
              <Button onClick={this.reset.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <ArrowBackIcon />
                <Translation>{t => t('backButton')}</Translation>
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
              <Translation>{t => t('reportConfirmationMessage')}</Translation>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.reset.bind(this)} color='secondary'>
              <Translation>{t => t('cancelReportButton')}</Translation>
            </Button>
            <Button onClick={this.reportPositive.bind(this)} color='primary' autoFocus>
              <Translation>{t => t('confirmReportButton')}</Translation>
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    )
  }
}

export default Exposures
