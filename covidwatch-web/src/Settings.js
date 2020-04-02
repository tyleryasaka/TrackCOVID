import React from 'react'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import API from './api'

const initialState = {
  useConfirmed: false
}

class Settings extends React.Component {
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
    this.setState({ useConfirmed: !useConfirmed })
    API.setUseConfirmed(!useConfirmed)
  }

  render () {
    const { useConfirmed } = this.state
    return (
      <Grid
        container
        direction='column'
        justify='center'
        alignItems='center'
      >
        <Typography style={{ marginTop: 25 }}>
          Selecting "Use only confirmed diagnoses" will ignore possible transmission paths from unconfirmed reports.
        </Typography>
        <List component='nav' style={{ marginTop: 15, width: '100%' }} aria-label='settings'>
          <ListItem button onClick={this.toggleUseConfirmed.bind(this)}>
            <ListItemIcon>
              {
                useConfirmed
                  ? (
                    <CheckBoxIcon />
                  ) : (
                    <CheckBoxOutlineBlankOutlinedIcon />
                  )
              }
            </ListItemIcon>
            <ListItemText primary='Use only confirmed diagnoses' />
          </ListItem>
        </List>
      </Grid>
    )
  }
}

export default Settings
