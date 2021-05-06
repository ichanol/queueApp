import React, { useEffect, useState, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native'
import { Events } from '../../helpers'

import { useNavigation } from '@react-navigation/native'
import { Context } from '../../contexts'

import messaging from '@react-native-firebase/messaging'


const Queue = () => {
  const navigation = useNavigation()

  const { userInfo } = useContext(Context)

  const [queue, setQueue] = useState(null)
  const [start, setStart] = useState(false)
  const [time, setTime] = useState({ show: false, timeLeft: 20 })

  const onCancel = () => {
    navigation.navigate('home')
    Events.publish('DEQUEUE')
  }

  const onStart = () => Events.publish('START')

  const countdownTimer = (startTime) => {
    const timer = setInterval(() => {
      const timeLeft = Math.round(
        20 - (new Date().getTime() - startTime) / 1000,
      )
      if (timeLeft < 0) {
        setTime({ show: false, timeLeft: 20 })
        return clearInterval(timer)
      }
      setTime((old) => ({ ...old, timeLeft }))
    }, 1000)
  }

  useEffect(() => {
    setQueue(userInfo.queue)
    if (userInfo.status === 'PENDING') {
      setStart(true)
    } else if (userInfo.state === 'ACTIVE') {
    } else {
      setStart(false)
    }
    // Events.subscribe('UPDATE_QUEUE', () => setQueue((old) => old + 1))
    Events.subscribe('TIMER', (startTime) => {
      console.log(startTime)
      setTime((old) => ({ ...old, show: true }))
      countdownTimer(startTime)
    })
  }, [userInfo])


  useEffect(() => {
    const unsubscribe = messaging().setBackgroundMessageHandler(
      async (remoteMessage) => {
        Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage))
        console.log('A new FCM message arrived!', JSON.stringify(remoteMessage))
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    messaging().subscribeToTopic('test')
    const unsubscribe2 = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage))
    })
    return unsubscribe2
  }, [])

  return (
    <View style={style.container}>
      <View style={style.ticket}>
        <View
          style={{
            ...style.section,
            ...style.top,
            transform: [
              //   { matrix: [] },
              //   { translateY: 0 },
              //   { translateX: 30 },
              //   { rotate: '50deg' },
              //   { translateY: 20 },
            ],
          }}>
          <Text style={style.m}>Position in Queue {userInfo.status}</Text>
          <Text style={style.queue}>{queue}</Text>
        </View>
        <View style={style.borderLine}>
          <View style={{ ...style.circle, ...style.right }} />
          <View style={style.dashedLine}>
            <View style={style.hideLine} />
          </View>
          <View style={{ ...style.circle, ...style.left }} />
        </View>
        <View
          style={{
            ...style.section,
            ...style.bottom,
            flex: time.show ? 1 : 0,
          }}>
          {time.show && (
            <View
              style={{
                ...style.detail,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 24 }}>{time.timeLeft}s</Text>
            </View>
          )}

          {userInfo.status === 'PENDING' && (
            <TouchableOpacity style={style.start} onPress={onStart}>
              <Text style={style.cancelText}>START</Text>
            </TouchableOpacity>
          )}

          {userInfo.status !== 'ACTIVE' && (
            <TouchableOpacity style={style.cancel} onPress={onCancel}>
              <Text style={style.cancelText}>LEAVE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09e3a5',
  },
  ticket: {
    flex: 0.8,
    width: '100%',
    marginHorizontal: 'auto',
    maxWidth: 275,
    maxHeight: 500,
    position: 'relative',
  },
  borderLine: {
    height: 24,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',

    backgroundColor: '#ffffff',
  },
  section: {
    flex: 1,
    maxHeight: '50%',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  top: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,

    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // flex: 0,
  },
  left: {
    borderTopLeftRadius: 48,
    borderBottomLeftRadius: 48,
    transform: [{ translateX: -18 }],
  },
  right: {
    borderTopRightRadius: 48,
    borderBottomRightRadius: 48,
    transform: [{ translateX: 18 }],
  },
  circle: {
    backgroundColor: '#09e3a5',
    height: 24,
    width: 24,
    zIndex: 1,
  },
  dashedLine: {
    width: '100%',
    borderRadius: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c0c0c0',
  },
  hideLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: 'white',
  },
  queue: {
    fontSize: 72,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  m: {
    fontSize: 22,
    opacity: 0.6,
  },
  cancel: {
    backgroundColor: '#ff5555',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  start: {
    backgroundColor: '#4477ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 16,
  },
  detail: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: 'orange',
  },
})

export default Queue
