import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { StatusContext } from '../status-context'

class StatusBanner extends Component {
  render () {
    const { status } = this.context
    const { onExposuresTab } = this.props
    const extraText = onExposuresTab ? '' : ' See the exposures tab.'
    if (status) {
      return (
        <View
          style={{ width: '100%', height: 60, backgroundColor: 'red', padding: 10 }}
        >
          <Text style={{ color: 'white' }} >A possible transmission path from an infected person to you has been discovered.{extraText}</Text>
        </View>
      )
    } else {
      return <View />
    }
  }
}

StatusBanner.contextType = StatusContext

export default StatusBanner
