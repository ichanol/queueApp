import 'react-native-gesture-handler'
import React from 'react'
import { StatusBar } from 'react-native'

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { CardStyleInterpolators } from '@react-navigation/stack'

import { AppContext } from './src/contexts'
import { Home, Queue } from './src/screens'
import { ConnectionManager } from './src/helpers'

const Stack = createStackNavigator()

const App = () => {
  return (
    <AppContext>
      <StatusBar backgroundColor='#09e3a5' />
      <ConnectionManager />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName='home'
          screenOptions={{
            headerStyle: {
              backgroundColor: '#09e3a5',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}>
          <Stack.Screen
            name='home'
            options={{
              title: 'MENU',
              headerTitleAlign: 'center',
            }}
            component={Home}
          />
          <Stack.Screen
            name='queue'
            options={{
              title: 'QUEUE',
              headerTitleAlign: 'center',
              headerLeft: () => null,
              headerShown: false,
            }}
            component={Queue}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext>
  )
}

export default App
