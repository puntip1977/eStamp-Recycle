import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types/models';

const SESSION_KEY = 'estamp.session.profile';

export async function saveSession(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export async function loadSession(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
