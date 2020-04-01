import React from 'react'
import Grid from '@material-ui/core/Grid'
import StatusAlert from './StatusAlert'

const initialState = {}

class Settings extends React.Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
  }

  render () {
    const { status } = this.props
    return (
      <Grid
        container
        direction='column'
        justify='center'
        alignItems='center'
      >
        <StatusAlert status={status} />
      </Grid>
    )
  }
}

export default Settings
