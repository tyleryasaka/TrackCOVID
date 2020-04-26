import React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import GetAppIcon from '@material-ui/icons/GetApp'
import { Translation } from 'react-i18next'
import theme from './theme'
import API from './api'
import {
  confirmcodeLength
} from 'trackcovid-js/config'

const initialState = {
  exposureStatus: false,
  loaded: false,
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

  async downloadHistory () {
    const checkpoints = await API.exportCheckpoints()
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(checkpoints))
    var dlAnchorElem = document.getElementById('downloadAnchorElem')
    dlAnchorElem.setAttribute('href', dataStr)
    dlAnchorElem.setAttribute('download', 'checkpoints.json')
    dlAnchorElem.click()
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

  render () {
    const { status, statusLoaded } = this.props
    const { mode } = this.state
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
              <Button onClick={this.downloadHistory.bind(this)} variant='contained' color='primary' aria-label='add' style={{ marginTop: 25 }}>
                <GetAppIcon />
                <Translation>{t => t('downloadHistoryButton')}</Translation>
              </Button>
              <a id='downloadAnchorElem' href='/' style={{ display: 'none' }}><Translation>{t => t('downloadHistoryButton')}</Translation></a>
            </Grid>
          ))
        }
      </Grid>
    )
  }
}

export default Exposures
