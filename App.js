import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableHighlight,
  Alert,
  FlatList,
  Button,
} from 'react-native';

import messaging from '@react-native-firebase/messaging';
import {Connection, Exchange, Queue} from 'react-native-rabbitmq';

const processENV = {
  baseURL: '192.168.1.45',
  port: 4000,
  endpoint: 'http://192.168.1.45:4000/api/booking481',
};

const FCM = messaging();
const config = {
  host: processENV.baseURL,
  port: 5672,
  username: 'guest',
  password: 'guest',
  virtualhost: '/',
};

const App = () => {
  const [serviceLocation, setServiceLocation] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [count, setCount] = useState(0);
  const [time, setTime] = useState(20);

  const [amqpInstance, setAmqpInstance] = useState(null);
  const [queueInstance, setQueueInstance] = useState(null);

  const amqpMessageHandler = (location, payload) => {
    switch (payload) {
      case 'QUEUE_UP':
        getQueue(location);
        break;
      default:
        break;
    }
  };

  const connectAMQP = location => {
    const connection = new Connection(config);

    connection.on('error', event => {
      console.log('ERROR => ', event);
    });

    connection.on('connected', event => {
      console.log('Connected => ', location, userInfo.token[0]);
      const queue = new Queue(connection, {
        name: userInfo.token,
        passive: false,
        durable: true,
        exclusive: true,
        consumer_arguments: {'x-priority': 1},
      });

      const exchange = new Exchange(connection, {
        name: location,
        type: 'topic',
        durable: true,
        autoDelete: false,
        internal: false,
      });

      queue.bind(exchange, '#.' + location);

      queue.on('message', data => {
        console.log('FROM TOPIC => ', location, data.message);
        setCount(count => count + 1);
        queue.basicAck(data.delivery_tag);

        amqpMessageHandler(location, data.message);
      });

      setQueueInstance(queue);
    });

    connection.connect();
    setAmqpInstance(connection);
  };

  const disconnectAMQP = async () => {
    if (!amqpInstance && !queueInstance) {
      return true;
    }

    const result = await Promise.all([
      queueInstance.close(),
      amqpInstance.clear(),
      amqpInstance.close(),
    ]);

    if (result.length > 0) {
      console.log('disconected from => ', userInfo.location);

      setAmqpInstance(null);
      setQueueInstance(null);
      return true;
    }
  };

  const countdownTimer = startTime => {
    const timer = setInterval(() => {
      const timeLeft = Math.round(
        20 - (new Date().getTime() - startTime) / 1000,
      );
      if (timeLeft < 0) {
        return clearInterval(timer);
      }
      setTime(timeLeft);
    }, 1000);
  };

  const getQueue = async serviceLocation => {
    const response = await fetch(
      processENV.endpoint + '/queue/' + serviceLocation,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
      },
    );
    const {
      success,
      queue,
      exist,
      queueStatus,
      location,
      startTime,
      timeLeft,
    } = await response.json();
    if (success) {
      setUserInfo({
        ...userInfo,
        queue,
        location,
        exist,
        status: queueStatus,
        startTime,
      });
      if (startTime !== userInfo.startTime) {
        countdownTimer(startTime);
      }
    }
  };

  const postQueue = selectedLocation => async () => {
    const isDisconnect = await disconnectAMQP();
    if (isDisconnect) {
      const response = await fetch(processENV.endpoint + '/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
        body: JSON.stringify({serviceLocation: selectedLocation}),
      });
      const {success, queue, exist, queueStatus} = await response.json();
      if (success) {
        connectAMQP(selectedLocation);
        if (exist) {
          getQueue(selectedLocation);
        } else {
          setUserInfo({
            ...userInfo,
            queue,
            location: selectedLocation,
            status: queueStatus,
          });
        }
      }
    }
  };

  const deleteQueue = async () => {
    const isDisconnect = await disconnectAMQP();

    if (isDisconnect) {
      const response = await fetch(processENV.endpoint + '/queue', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token,
        },
        body: JSON.stringify({serviceLocation: userInfo.location}),
      });
      const {success} = await response.json();
      if (success) {
        setUserInfo({
          ...userInfo,
          queue: null,
          location: null,
          status: null,
          exist: null,
          startTime: null,
        });
      }
    }
  };

  const postTimer = async () => {
    const response = await fetch(processENV.endpoint + '/timer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + userInfo.token,
      },
      body: JSON.stringify({serviceLocation: userInfo.location}),
    });
    const {success, startTime, queueStatus} = await response.json();
    if (success) {
      setUserInfo({...userInfo, status: queueStatus, startTime});
      countdownTimer(startTime);
    }
  };

  useEffect(() => {
    const getServiceLocation = async () => {
      try {
        const response = await fetch(processENV.endpoint + '/service');
        const {success, serviceLocation} = await response.json();
        if (success) {
          setServiceLocation(serviceLocation);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getToken = async () => {
      const firebaseCloudMessagingToken = await FCM.getToken();
      setUserInfo({...userInfo, token: firebaseCloudMessagingToken});
    };

    getServiceLocation();
    getToken();

    return () => {
      disconnectAMQP();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().setBackgroundMessageHandler(
      async remoteMessage => {
        Alert.alert(
          'A new FCM message arrived!',
          JSON.stringify(remoteMessage),
        );
        console.log(
          'A new FCM message arrived!',
          JSON.stringify(remoteMessage),
        );
      },
    );
    messaging().subscribeToTopic('test');
    const unsubscribe2 = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });
    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  return (
    <SafeAreaView>
      <FlatList
        data={serviceLocation}
        renderItem={({item}) => (
          <TouchableHighlight onPress={postQueue(item.location)}>
            <Text>{item.location}</Text>
          </TouchableHighlight>
        )}
        keyExtractor={item => item.location}
      />
      <Text>
        {userInfo.queue} @ {userInfo.location} {'=>'} {userInfo.status}
        <Text style={{color: userInfo.exist ? 'red' : 'grey'}}>{count}</Text>
      </Text>
      <Text>
        {count} => this is timer => {time}
      </Text>
      {userInfo.queue && <Button title="dequeue" onPress={deleteQueue} />}
      {userInfo.status === 'PENDING' && (
        <Button title="START" onPress={postTimer} />
      )}
    </SafeAreaView>
  );
};

export default App;
