import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getDeviceId() {
  let id = await AsyncStorage.getItem('device_id');

  if (!id) {
    id = Application.getAndroidId() || Math.random().toString(36);
    await AsyncStorage.setItem('device_id', id);
  }

  return id;
}
