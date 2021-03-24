import React, {useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
  TouchableHighlight,
  Alert,
  ToastAndroid
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';
import messaging from '@react-native-firebase/messaging';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const socket = io('http://192.168.1.45:4000');
  const FCM = messaging();

  useEffect(() => {
    socket.on('test', x => console.log(x));
    (async () => {
      console.log(await FCM.getToken())
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().setBackgroundMessageHandler(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });
    messaging().subscribeToTopic('test')
    return unsubscribe;
   }, []);

  const emit = () => socket.send('fromdevice', 'eiei');

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <TouchableHighlight
            style={{width: 200, height: 50, backgroundColor: 'red'}}
            onPress={emit}>
            <Text>Emit</Text>
          </TouchableHighlight>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
