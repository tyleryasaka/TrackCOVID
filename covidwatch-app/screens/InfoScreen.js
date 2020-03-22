import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { RectButton, ScrollView } from 'react-native-gesture-handler'
import StatusBanner from '../components/status-banner'

class InfoScreen extends Component {
  render () {
    return (
      <View style={styles.container} contentContainerStyle={styles.contentContainer}>
        <StatusBanner />
        <ScrollView>
          <OptionButton
            icon='md-medkit'
            label='CDC COVID-19'
            onPress={() => WebBrowser.openBrowserAsync('https://www.cdc.gov/coronavirus/2019-ncov/index.html')}
          />
          <OptionButton
            icon='md-globe'
            label='WHO COVID-19'
            onPress={() => WebBrowser.openBrowserAsync('https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public')}
          />
          <OptionButton
            icon='md-code'
            label='Learn more about COVID Watch app'
            onPress={() => WebBrowser.openBrowserAsync('https://github.com/tyleryasaka/covid-watch')}
          />
        </ScrollView>
      </View>
    )
  }
}

function OptionButton ({ icon, label, onPress, isLastOption }) {
  return (
    <RectButton style={[styles.option, isLastOption && styles.lastOption]} onPress={onPress}>
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.optionIconContainer}>
          <Ionicons name={icon} size={22} color='rgba(0,0,0,0.35)' />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionText}>{label}</Text>
        </View>
      </View>
    </RectButton>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa'
  },
  contentContainer: {
    paddingTop: 15
  },
  optionIconContainer: {
    marginRight: 12
  },
  option: {
    backgroundColor: '#fdfdfd',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: '#ededed'
  },
  lastOption: {
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  optionText: {
    fontSize: 15,
    alignSelf: 'flex-start',
    marginTop: 1
  }
})

export default InfoScreen
