import React from 'react'
import Alert from '@material-ui/lab/Alert'

class StatusAlert extends React.Component {
  render () {
    const { status, onExposuresTab } = this.props
    const extraText = onExposuresTab ? '' : ' See the status tab.'
    if (status) {
      return (
        <Alert style={{ marginTop: 25, width: '100%' }} severity='error'>Your risk level is elevated.{extraText}</Alert>
      )
    } else {
      return <div />
    }
  }
}

export default StatusAlert
