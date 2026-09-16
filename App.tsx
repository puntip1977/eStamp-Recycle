import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/employee/LoginScreen';
import { MainTabs } from './src/navigation/MainTabs';
import { loadSession } from './src/lib/session';
import { colors } from './src/theme/theme';
import { Profile } from './src/types/models';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setProfile)
      .finally(() => setRestoring(false));
  }, []);

  if (restoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {profile ? <MainTabs profile={profile} /> : <LoginScreen onLoggedIn={setProfile} />}
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
