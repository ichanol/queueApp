import 'react-native-gesture-handler'
import React, { useEffect, useState, useContext } from 'react'
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Button,
  View,
  TextInput,
} from 'react-native'

import { Context } from '../../contexts'
import { Events } from '../../helpers'
import { useNavigation } from '@react-navigation/native'

const processENV = {
  baseURL: '192.168.1.58',
  port: 4000,
  endpoint: 'http://192.168.1.58:4000/api/booking481',
}

const Home = () => {
  const [serviceLocation, setServiceLocation] = useState([])
  const navigator = useNavigation()
  const [count, setCount] = useState(0)
  const [time, setTime] = useState(20)

  const { userInfo, dispatch } = useContext(Context)

  const countdownTimer = (startTime) => {
    const timer = setInterval(() => {
      const timeLeft = Math.round(
        20 - (new Date().getTime() - startTime) / 1000,
      )
      if (timeLeft < 0) {
        return clearInterval(timer)
      }
      setTime(timeLeft)
    }, 1000)
  }

  useEffect(() => {
    const getServiceLocation = async () => {
      try {
        const response = await fetch(processENV.endpoint + '/service')
        const { success, serviceLocation } = await response.json()
        if (success) {
          setServiceLocation(serviceLocation)
        }
      } catch (error) {
        console.log(error)
      }
    }

    getServiceLocation()

    const x = Events.subscribe('NAVIGATE_QUEUE', () =>
      navigator.navigate('queue'),
    )
  }, [])

  // useEffect(() => {
  //   const unsubscribe = messaging().setBackgroundMessageHandler(
  //     async (remoteMessage) => {
  //       Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage))
  //       console.log('A new FCM message arrived!', JSON.stringify(remoteMessage))
  //     },
  //   )
  //   return unsubscribe
  // }, [])

  // useEffect(() => {
  //   messaging().subscribeToTopic('test')
  //   const unsubscribe2 = messaging().onMessage(async (remoteMessage) => {
  //     Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage))
  //   })
  //   return unsubscribe2
  // }, [])

  const baseColor = [9, 227, 165]

  const renderMenu = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => Events.publish('ENQUEUE', item.location)}
      style={{
        backgroundColor: 'white',
        marginVertical: 12,
        marginHorizontal: 12,
        padding: 16,
        borderRadius: 16,
      }}>
      <Text style={{ color: 'rgba(0,0,0,0.5)' }}>{item.location}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={{ backgroundColor: '#f2f2f2', height: '100%' }}>
      <View
        style={{
          paddingHorizontal: 32,
          paddingVertical: 24,
          marginBottom: 12,
          backgroundColor: `rgb(${baseColor.join()})`,
          borderBottomRightRadius: 16,
          borderBottomLeftRadius: 16,
        }}>
        <TextInput
          placeholder='Service location'
          placeholderTextColor='white'
          style={{
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: '#ffffff',
            borderRadius: 16,
            paddingHorizontal: 12,
            color: '#ffffff',
          }}></TextInput>
      </View>

      <FlatList
        data={serviceLocation}
        renderItem={renderMenu}
        keyExtractor={(item) => item.location}
        style={{ backgroundColor: '#f2f2f2' }}
      />
      {/* <Text>
        {userInfo.queue} @ {userInfo.location} {'=>'} {userInfo.status}
        <Text style={{ color: userInfo.exist ? 'red' : 'grey' }}>{count}</Text>
      </Text>
      <Text>
        {count} => this is timer => {time}
      </Text>
      {userInfo.queue && (
        <Button title='dequeue' onPress={() => Events.publish('DEQUEUE')} />
      )}
      {userInfo.status === 'PENDING' && (
        <Button title='START' onPress={() => Events.publish('START')} />
      )} */}
    </SafeAreaView>
  )
}

export default Home
