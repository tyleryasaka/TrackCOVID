import React from 'react'

const initialState = {}

class Exposures extends React.Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
    // API.getUseConfirmed().then(useConfirmed => {
    //   this.setState({ useConfirmed })
    // })
  }

  render () {
    return (
      <h1>Exposures</h1>
    )
  }
}

export default Exposures
