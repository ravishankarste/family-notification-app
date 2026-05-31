import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ALARM_PREF_KEY = 'ALARM_PREFERENCE';
export const CUSTOM_ALARM_URI_KEY = 'CUSTOM_ALARM_URI';

export type AlarmPreference = 'default1' | 'default2' | 'default3' | 'custom';

export async function playAlarm(isLooping: boolean = true) {
  // Stop existing alarm if any
  await stopAlarm();

  let preference = 'default1';
  try {
    preference = (await AsyncStorage.getItem(ALARM_PREF_KEY)) || 'default1';
  } catch (e) {
    console.error('Failed to read alarm preference', e);
  }

  let soundSource;
  if (preference === 'custom') {
    try {
      const customUri = await AsyncStorage.getItem(CUSTOM_ALARM_URI_KEY);
      if (customUri) {
        soundSource = { uri: customUri };
      } else {
        soundSource = require('../../assets/alarm.mp3'); // fallback
      }
    } catch (e) {
      soundSource = require('../../assets/alarm.mp3'); // fallback
    }
  } else if (preference === 'default2') {
    soundSource = require('../../assets/alarm2.wav');
  } else if (preference === 'default3') {
    soundSource = require('../../assets/alarm3.wav');
  } else {
    soundSource = require('../../assets/alarm.mp3'); // default1
  }

  try {
    const { sound } = await Audio.Sound.createAsync(
      soundSource,
      { shouldPlay: true, isLooping }
    );
    await sound.setVolumeAsync(1.0);
    
    // Attach to global scope for headless JS access and UI failsafe
    (global as any).bgAlarmSound = sound;
  } catch (error) {
    console.error('Failed to play alarm audio:', error);
  }
}

export async function stopAlarm() {
  if ((global as any).bgAlarmSound) {
    try {
      await (global as any).bgAlarmSound.stopAsync();
      await (global as any).bgAlarmSound.unloadAsync();
    } catch (e) {
      console.error('Failed to stop alarm audio:', e);
    } finally {
      (global as any).bgAlarmSound = null;
    }
  }
}
