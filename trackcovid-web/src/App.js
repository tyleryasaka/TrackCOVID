import React, { Suspense } from 'react'
import Container from '@material-ui/core/Container'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import CropFree from '@material-ui/icons/CropFree'
import Face from '@material-ui/icons/Face'
import MenuIcon from '@material-ui/icons/Menu'
import InfoIcon from '@material-ui/icons/Info'
import AppBar from '@material-ui/core/AppBar'
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import CheckpointsPage from './Checkpoints'
import ExposuresPage from './Exposures'
import StatusAlert from './StatusAlert'
import logo from './logo.svg'
import API from './api'
import { Translation } from 'react-i18next'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import i18n from './i18n'
import supportedLanguages from './languages'

const oneSecond = 1000
const pollingTime = 30 * oneSecond

function ListItemLink (props) {
  return <ListItem button component='a' {...props} />
}

class App extends React.Component {
  constructor () {
    super()
    this.state = {
      currentTab: 'checkpoints',
      status: false,
      statusLoaded: false,
      isDrawerOpen: false,
      currentLanguage: i18n.language
    }
  }

  componentDidMount () {
    this.checkConfirmcode()
    const updateStatus = async () => {
      try {
        const exposureStatus = await API.getExposureStatus()
        this.setState({ status: exposureStatus, statusLoaded: true })
      } catch (e) {
        console.error(e)
        this.setState({ status: false, statusLoaded: false })
      }
    }
    updateStatus()
    setInterval(updateStatus, pollingTime)
  }

  checkConfirmcode () {
    const urlParams = new URLSearchParams(window.location.search)
    const confirmcode = urlParams.get('confirm')
    if (confirmcode) {
      this.setState({ currentTab: 'status' })
    }
  }

  onChangeTab (event, newVal) {
    this.setState({ currentTab: newVal })
  }

  openDrawer () {
    this.setState({ isDrawerOpen: true })
  }

  closeDrawer () {
    this.setState({ isDrawerOpen: false })
  }

  onSelectLanguage (event) {
    i18n.changeLanguage(event.target.value)
    this.setState({ currentLanguage: event.target.value })
  }

  render () {
    const { currentTab, status, statusLoaded, isDrawerOpen, currentLanguage } = this.state
    const CurrentPage = (currentTab === 'checkpoints')
      ? CheckpointsPage
      : ExposuresPage
    return (
      <div>
        <AppBar position='static' color='secondary'>
          <Container maxWidth='sm' style={{ flexGrow: 1 }}>
            <Toolbar>
              <IconButton
                edge='start'
                color='inherit'
                aria-label='open drawer'
                onClick={this.openDrawer.bind(this)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant='h6' component='h1' style={{ flexGrow: 1 }}>
                TrackCOVID (beta)
              </Typography>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth='sm' style={{ marginBottom: 76 }}>
          <Suspense fallback='loading'>
            <StatusAlert status={status} onExposuresTab={currentTab === 'status'} />
            <CurrentPage status={status} statusLoaded={statusLoaded} />
            <Container style={{ padding: 10, backgroundColor: '#343434', width: '100%', marginTop: 50, textAlign: 'center', verticalAlign: 'middle', fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', lineHeight: '24px' }}>
              <img src={logo} alt='Logo' width={24} height={24} style={{ verticalAlign: 'middle', marginRight: 8, filter: 'grayscale(100%)', opacity: 0.75 }} />
              <span style={{ verticalAlign: 'middle', lineHeight: '24px' }}>Track</span><span style={{ verticalAlign: 'middle', lineHeight: '24px' }}>COVID</span>
            </Container>
            <Container style={{ textAlign: 'center' }}>
              <div>
                <FormControl style={{ marginTop: '20px' }}>
                  <Select
                    labelId='language-select-label'
                    id='language-select'
                    value={currentLanguage}
                    onChange={this.onSelectLanguage.bind(this)}
                  >
                    { supportedLanguages.map(language => {
                      return (
                        <MenuItem value={language.id}>{language.name}</MenuItem>
                      )
                    }) }
                  </Select>
                </FormControl>
              </div>
            </Container>
          </Suspense>
        </Container>
        <BottomNavigation
          value={currentTab}
          style={{
            width: '100%',
            position: 'fixed',
            bottom: 0
          }}
          onChange={this.onChangeTab.bind(this)}
          showLabels
        >
          <BottomNavigationAction label={<Translation>{t => t('checkpointsTab')}</Translation>} value='checkpoints' icon={<CropFree />} />
          <BottomNavigationAction label=<Translation>{t => t('statusTab')}</Translation> value='status' icon={<Face />} />
        </BottomNavigation>
        <SwipeableDrawer
          open={isDrawerOpen}
          onClose={this.closeDrawer.bind(this)}
        >
          <List component='nav' aria-label='settings'>
            <ListItemLink style={{ width: 250 }} href='/' target='_blank'>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary=<Translation>{t => t('aboutButton')}</Translation> />
            </ListItemLink>
          </List>
        </SwipeableDrawer>
      </div>
    )
  }
}

export default App
