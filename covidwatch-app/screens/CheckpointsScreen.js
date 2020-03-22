import React, { Component } from 'react'
import { Platform, StyleSheet, Text, View, Button } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import API from '../api'

class CheckpointsScreen extends Component {
  constructor () {
    super()
    this.state = {
      mode: 'home',
      checkpointKey: null
    }
  }

  async becomeHost () {
    const { newCheckpointKey, time } = await API.hostCheckpoint()
    this.setState({
      mode: 'host',
      checkpointKey: newCheckpointKey,
      checkpointTime: time
    })
    console.log(newCheckpointKey)
  }

  render () {
    const { mode, checkpointKey, checkpointTime } = this.state
    if (mode === 'home') {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.getStartedContainer}>
              <Button title='Host a checkpoint' onPress={this.becomeHost.bind(this)} />
            </View>
          </ScrollView>
        </View>
      )
    } else if (mode === 'host') {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.getStartedContainer}>
              <Text style={styles.getStartedText}>
                You are now hosting a checkpoint. Others may check in by using the QR code below.
              </Text>
              <QRCode value={checkpointKey} size={250} />
              <Text style={styles.getStartedText}>
                Checkpoint created {checkpointTime}
              </Text>
            </View>
          </ScrollView>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center'
  },
  contentContainer: {
    paddingTop: 30
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50
  },
  homeScreenFilename: {
    marginVertical: 7
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)'
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center'
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3
      },
      android: {
        elevation: 20
      }
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center'
  },
  navigationFilename: {
    marginTop: 5
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center'
  },
  helpLink: {
    paddingVertical: 15
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7'
  }
})

export default CheckpointsScreen
