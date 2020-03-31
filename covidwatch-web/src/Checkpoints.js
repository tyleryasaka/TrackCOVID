import React from 'react'
import Typography from '@material-ui/core/Typography'

const initialState = {}

class Checkpoints extends React.Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
  }

  render () {
    return (
      <Typography variant='h4' component='h2'>
        Checkpoints
      </Typography>
    )
  }
}

export default Checkpoints
