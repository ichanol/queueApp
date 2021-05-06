import 'react-native-gesture-handler'
import { useEffect, useState, useContext } from 'react'
import { Context } from '../../contexts'
import { Connection, Exchange, Queue } from 'react-native-rabbitmq'
import { Events } from '../Events'
import messaging from '@react-native-firebase/messaging'

const processENV = {
  baseURL: '192.168.1.58',
  port: 4000,
  endpoint: 'http://192.168.1.58:4000/api/booking481',
}

const config = {
  host: processENV.baseURL,
  port: 5672,
  username: 'guest',
  password: 'guest',
  virtualhost: '/',
}

const FCM = messaging()

const ConnectionManager = () => {
  const { userInfo, dispatch } = useContext(Context)

  const setUserInfo = (payload) => dispatch({ TYPE: 'SET', payload })

  const [amqpInstance, setAmqpInstance] = useState(null)
  const [queueInstance, setQueueInstance] = useState(null)

  const amqpMessageHandler = (location, payload) => {
    switch (payload) {
      case 'QUEUE_UP':
        getQueue(location)
        break
      case 'test msg':
        console.log('update test msg')
        break
      default:
        break
    }
  }

  const connectAMQP = (location) => {
    const connection = new Connection(config)

    connection.on('connected', (event) => {
      console.log('Connected => ', location, userInfo.token[0])

      const queue = new Queue(connection, {
        name: userInfo.token,
        passive: false,
        durable: true,
        exclusive: true,
        consumer_arguments: { 'x-priority': 1 },
      })

      const exchange = new Exchange(connection, {
        name: location,
        type: 'topic',
        durable: true,
        autoDelete: false,
        internal: false,
      })

      queue.bind(exchange, '#.' + location)

      queue.on('message', (data) => {
        console.log('FROM TOPIC => ', location, data.message, userInfo.token[0])

        amqpMessageHandler(location, data.message)
        queue.basicAck(data.delivery_tag)
      })

      setQueueInstance(queue)
    })

    connection.on('error', (event) => {
      console.log('ERROR => ', event)
    })

    connection.connect()
    setAmqpInstance(connection)
  }

  const disconnectAMQP = async () => {
    if (!amqpInstance && !queueInstance) {
      return true
    }

    const result = await Promise.all([
      queueInstance.close(),
      amqpInstance.clear(),
      amqpInstance.close(),
    ])

    if (result.length > 0) {
      console.log('disconected from => ', userInfo.location)

      setAmqpInstance(null)
      setQueueInstance(null)
      return true
    }
  }

  const getQueue = async (serviceLocation) => {
    const response = await fetch(
      processENV.endpoint + '/queue/' + serviceLocation,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
      },
    )
    const {
      success,
      queue,
      exist,
      queueStatus,
      location,
      startTime,
      timeLeft,
    } = await response.json()
    if (success) {
      setUserInfo({
        queue,
        location,
        exist,
        status: queueStatus,
        startTime,
      })
      Events.publish('NAVIGATE_QUEUE')
      if (startTime && startTime !== userInfo.startTime) {
        Events.publish('TIMER', startTime)
      }
    }
  }

  const postQueue = async (selectedLocation) => {
    const isDisconnect = await disconnectAMQP()
    if (isDisconnect) {
      const response = await fetch(processENV.endpoint + '/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
        body: JSON.stringify({ serviceLocation: selectedLocation }),
      })
      const { success, queue, exist, queueStatus } = await response.json()
      if (success) {
        connectAMQP(selectedLocation)

        if (exist) {
          await getQueue(selectedLocation)
        } else {
          setUserInfo({
            queue,
            location: selectedLocation,
            status: queueStatus,
          })
          Events.publish('NAVIGATE_QUEUE')
        }
      }
    }
  }

  const deleteQueue = async () => {
    const isDisconnect = await disconnectAMQP()

    if (isDisconnect) {
      const response = await fetch(processENV.endpoint + '/queue', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
        body: JSON.stringify({ serviceLocation: userInfo.location }),
      })
      const { success } = await response.json()
      if (success) {
        setUserInfo({
          queue: null,
          location: null,
          status: null,
          exist: null,
          startTime: null,
        })
      }
    }
  }

  const postTimer = async () => {
    const response = await fetch(processENV.endpoint + '/timer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + userInfo.token,
      },
      body: JSON.stringify({ serviceLocation: userInfo.location }),
    })
    const { success, startTime, queueStatus } = await response.json()
    if (success) {
      setUserInfo({ status: queueStatus, startTime })
      Events.publish('TIMER', startTime)
    }
  }

  useEffect(() => {
    const unsubscribeEnqueue = Events.subscribe('ENQUEUE', (location) => {
      postQueue(location)
    })
    const unsubscribeDequeue = Events.subscribe('DEQUEUE', () => {
      deleteQueue()
    })
    const unsubscribeStart = Events.subscribe('START', () => {
      postTimer()
    })

    return () => {
      unsubscribeEnqueue()
      unsubscribeDequeue()
      unsubscribeStart()
    }
  }, [userInfo, queueInstance, amqpInstance])

  useEffect(() => {
    const getToken = async () => {
      const firebaseCloudMessagingToken = await FCM.getToken()
      setUserInfo({ token: firebaseCloudMessagingToken })
    }

    getToken()

    return () => {
      disconnectAMQP()
    }
  }, [])

  return null
}

export default ConnectionManager
