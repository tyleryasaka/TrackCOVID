import React, { Component } from 'react'
import { Button, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import * as WebBrowser from 'expo-web-browser'
import API from '../api'

const initialState = {
  exposureStatus: false,
  loaded: false
}

class ExposuresScreen extends Component {
  constructor () {
    super()
    this.state = initialState
  }

  componentDidMount () {
    API.getExposureStatus().then(exposureStatus => {
      this.setState({ exposureStatus, loaded: true })
    })
  }

  reportExposure () {
    console.log('report')
  }

  render () {
    const { exposureStatus, loaded } = this.state
    const statusMessageLoading = 'Loading your status...'
    const statusMessageNegative = 'No transmission paths from infected individuals to you have been discovered at this time. However, everyone is at risk and individuals should follow the directives of the CDC as well as local, state, and federal governments.'
    const statusMessagePositive = 'A possible transmission path from an infected individual to you has been discovered. You should take precautionary measures to protect yourself and others, according to the directives of the CDC  as well as local, state, and federal governments.'
    const statusMessage = loaded
      ? (exposureStatus
        ? statusMessagePositive
        : statusMessageNegative)
      : statusMessageLoading

    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.welcomeContainer}>
            <View style={styles.getStartedContainer}>
              <Text style={styles.getStartedText}>
                {statusMessage}
              </Text>
              <Text style={styles.getStartedText}>
                If you or someone you have been in close contact with have received a positive COVID-19 test, you should report it using the button below. Your identity will remain anonymous.
              </Text>
              <Button title='Report positive status' onPress={this.reportExposure.bind(this)} />
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

function DevelopmentModeNotice () {
  if (__DEV__) {
    const learnMoreButton = (
      <Text onPress={handleLearnMorePress} style={styles.helpLinkText}>
        Learn more
      </Text>
    )

    return (
      <Text style={styles.developmentModeText}>
        Development mode is enabled: your app will be slower but you can use useful development
        tools. {learnMoreButton}
      </Text>
    )
  } else {
    return (
      <Text style={styles.developmentModeText}>
        You are not in development mode: your app will run at full speed.
      </Text>
    )
  }
}

function handleLearnMorePress () {
  WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/workflow/development-mode/')
}

function handleHelpPress () {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/versions/latest/get-started/create-a-new-app/#making-your-first-change'
  )
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
    marginTop: 20,
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

export default ExposuresScreen
