import React, { Component } from 'react'
import { Alert, Button, Platform, StyleSheet, Text, View, Switch } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { BarCodeScanner } from 'expo-barcode-scanner'
import API from '../api'
import { StatusContext } from '../status-context'
import StatusBanner from '../components/status-banner'
const {
  confirmcodeLength
} = require('covidwatch-js/config')

const initialState = {
  exposureStatus: false,
  loaded: false,
  useConfirmed: null,
  hasPermission: null,
  mode: 'default'
}

class ExposuresScreen extends Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
    API.getUseConfirmed().then(useConfirmed => {
      this.setState({ useConfirmed })
    })
  }

  async toggleUseConfirmed () {
    const { useConfirmed } = this.state
    await API.setUseConfirmed(!useConfirmed)
    const updatedVal = await API.getUseConfirmed()
    this.setState({ useConfirmed: updatedVal })
  }

  showReportPrompt () {
    this.setState({ mode: 'report-prompt' })
  }

  exitReportPrompt () {
    this.setState({ mode: 'default' })
  }

  async reportPositive () {
    Alert.alert(
      'Report positive for COVID-19?',
      'This action cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        { text: 'Yes, report positive',
          onPress: () => {
            API.reportPositive().then(() => {
              this.setState({ mode: 'default' })
              Alert.alert('Your diagnosis was reported successfully. Thank you.')
            })
          } }
      ],
      { cancelable: false }
    )
  }

  async scanConfirmcode () {
    const { status } = await BarCodeScanner.requestPermissionsAsync()
    this.setState({
      hasPermission: status === 'granted',
      mode: 'scan-confirmcode'
    })
  }

  async handleBarCodeScanned ({ type, data }) {
    if (data && (data.length === confirmcodeLength)) {
      this.setState({ mode: 'default' })
      await API.reportPositive(data)
      Alert.alert('Your diagnosis was reported successfully. Thank you.')
    } else {
      // QR code may be a url
      const urlSplit = data.split('?confirm=')
      if ((urlSplit.length === 2) && (urlSplit[1].length === confirmcodeLength)) {
        this.setState({ mode: 'default' })
        await API.reportPositive(urlSplit[1])
        Alert.alert('Your diagnosis was reported successfully. Thank you.')
      } else {
        this.setState({ mode: 'default' })
        Alert.alert('The code you scanned could not be read.')
      }
    }
  }

  render () {
    const { status, loaded } = this.context
    const { useConfirmed, mode, hasPermission } = this.state
    const statusMessageLoading = 'Loading your status...'
    const statusMessageNegative = 'No transmission paths from infected individuals to you have been discovered at this time. However, everyone is at risk and individuals should follow the directives of the CDC as well as local, state, and federal governments.'
    const statusMessagePositive = 'A possible transmission path from an infected individual to you has been discovered. You should take precautionary measures to protect yourself and others, according to the directives of the CDC  as well as local, state, and federal governments.'
    const statusMessage = loaded
      ? (status
        ? statusMessagePositive
        : statusMessageNegative)
      : statusMessageLoading

    const scanView = () => (
      (hasPermission === null)
        ? (
          <Text>Requesting camera permission</Text>
        ) : (hasPermission === false)
          ? (
            <Text>No access to camera</Text>
          ) : (
            <View style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}>
              <BarCodeScanner
                onBarCodeScanned={this.handleBarCodeScanned.bind(this)}
                style={StyleSheet.absoluteFillObject}
              />
              <Button title='Cancel' onPress={this.showReportPrompt.bind(this)} />
            </View>
          )
    )

    return (mode === 'default')
      ? (
        <View style={styles.container}>
          <StatusBanner onExposuresTab />
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.welcomeContainer}>
              <View style={styles.getStartedContainer}>
                <Text>Use only confirmed diagnoses?</Text>
                <Switch
                  value={useConfirmed}
                  onValueChange={this.toggleUseConfirmed.bind(this)}
                />
                <Text style={styles.getStartedText}>
                  {statusMessage}
                </Text>
                <Text style={styles.getStartedText}>
                  If you or someone you have been in close contact with have received a positive COVID-19 test, you should report it using the button below. You will remain anonymous.
                </Text>
                <View style={{ marginTop: 20 }} />
                <Button title='Report positive status' onPress={this.showReportPrompt.bind(this)} />
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (mode === 'scan-confirmcode')
        ? (scanView())
        : (
          <View style={styles.container}>
            <StatusBanner onExposuresTab />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
              <View style={styles.welcomeContainer}>
                <View style={styles.getStartedContainer}>
                  <Text>Do you have a confirmation code to scan?</Text>
                  <View style={{ marginTop: 25 }} />
                  <Button title='Yes, scan code' onPress={this.scanConfirmcode.bind(this)} />
                  <View style={{ marginTop: 25 }} />
                  <Button title='No confirmation code' onPress={this.reportPositive.bind(this)} />
                  <View style={{ marginTop: 60 }} />
                  <Button color='#787878' title='Cancel' onPress={this.exitReportPrompt.bind(this)} />
                </View>
              </View>
            </ScrollView>
          </View>
        )
  }
}

ExposuresScreen.navigationOptions = {
  header: null
}

ExposuresScreen.contextType = StatusContext

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
    marginTop: 20,
    fontSize: 14,
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

export default ExposuresScreen
