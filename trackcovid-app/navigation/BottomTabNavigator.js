import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBarIcon from '../components/TabBarIcon';
import CheckpointsScreen from '../screens/CheckpointsScreen';
import HomeScreen from '../screens/ExposuresScreen';
import LinksScreen from '../screens/InfoScreen';

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = 'Home';

export default function BottomTabNavigator({ navigation, route }) {
  // Set the header title on the parent stack navigator depending on the
  // currently active tab. Learn more in the documentation:
  // https://reactnavigation.org/docs/en/screen-options-resolution.html
  navigation.setOptions({ headerTitle: getHeaderTitle(route) });

  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
      <BottomTab.Screen
        name="Checkpoints"
        component={CheckpointsScreen}
        options={{
          title: 'Checkpoints',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="md-checkmark" />,
        }}
      />
      <BottomTab.Screen
        name="Exposure"
        component={HomeScreen}
        options={{
          title: 'Exposures',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="md-warning" />,
        }}
      />
      <BottomTab.Screen
        name="Info"
        component={LinksScreen}
        options={{
          title: 'Info',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="md-book" />,
        }}
      />
    </BottomTab.Navigator>
  );
}

function getHeaderTitle(route) {
  const routeName = route.state?.routes[route.state.index]?.name ?? INITIAL_ROUTE_NAME;

  switch (routeName) {
    case 'Checkpoints':
      return 'Host or Join a Checkpoint';
    case 'Exposure':
      return 'My Exposure Status';
    case 'Info':
      return 'More Info';
  }
}
