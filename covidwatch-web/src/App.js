import React from 'react'
import Container from '@material-ui/core/Container'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import CropFree from '@material-ui/icons/CropFree'
import Face from '@material-ui/icons/Face'
import Settings from '@material-ui/icons/Settings'
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
import SettingsPage from './Settings'
import StatusAlert from './StatusAlert'
import API from './api'

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
      isDrawerOpen: false
    }
  }

  componentDidMount () {
    const updateStatus = async () => {
      const exposureStatus = await API.getExposureStatus()
      this.setState({ status: exposureStatus, statusLoaded: true })
    }
    updateStatus()
    setInterval(updateStatus, pollingTime)
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

  render () {
    const { currentTab, status, statusLoaded, isDrawerOpen } = this.state
    const CurrentPage = (currentTab === 'checkpoints')
      ? CheckpointsPage
      : (currentTab === 'status')
        ? ExposuresPage
        : SettingsPage
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
          <StatusAlert status={status} onExposuresTab={currentTab === 'status'} />
          <CurrentPage status={status} statusLoaded={statusLoaded} />
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
          <BottomNavigationAction label='Checkpoints' value='checkpoints' icon={<CropFree />} />
          <BottomNavigationAction label='Status' value='status' icon={<Face />} />
          <BottomNavigationAction label='Settings' value='settings' icon={<Settings />} />
        </BottomNavigation>
        <SwipeableDrawer
          open={isDrawerOpen}
          onClose={this.closeDrawer.bind(this)}
        >
          <List component='nav' aria-label='settings'>
            <ListItemLink style={{ width: 250 }} href='https://github.com/tyleryasaka/covid-watch' target='_blank'>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary='About' />
            </ListItemLink>
          </List>
        </SwipeableDrawer>
      </div>
    )
  }
}

export default App
