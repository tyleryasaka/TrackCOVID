import React from 'react'
import Alert from '@material-ui/lab/Alert'
import { Translation } from 'react-i18next'

class StatusAlert extends React.Component {
  render () {
    const { status, onExposuresTab } = this.props
    const extraText = onExposuresTab ? '' : (<Translation>{t => ' ' + t('seeStatusTabMessage')}</Translation>)
    if (status) {
      return (
        <Alert style={{ marginTop: 25, width: '100%' }} severity='error'><Translation>{t => t('elevatedRiskAlertMessage')}</Translation>{extraText}</Alert>
      )
    } else {
      return <div />
    }
  }
}

export default StatusAlert
