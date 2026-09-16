import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScanFlowScreen } from '../screens/employee/ScanFlowScreen';
import { HistoryScreen } from '../screens/employee/HistoryScreen';
import { LeaderboardScreen } from '../screens/employee/LeaderboardScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { colors, font } from '../theme/theme';
import { Profile } from '../types/models';

const Tab = createBottomTabNavigator();

export function MainTabs({ profile }: { profile: Profile }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: font.small, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen
        name="Scan"
        options={{ title: '📸 ถ่ายรูป' }}
      >
        {() => <ScanFlowScreen profile={profile} />}
      </Tab.Screen>
      <Tab.Screen name="History" options={{ title: '🗒️ ประวัติ' }}>
        {() => <HistoryScreen profile={profile} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" options={{ title: '🏆 กระดานผู้นำ' }}>
        {() => <LeaderboardScreen profile={profile} />}
      </Tab.Screen>
      {profile.role === 'admin' && (
        <Tab.Screen name="Admin" options={{ title: '⚙️ แอดมิน' }}>
          {() => <AdminHomeScreen profile={profile} />}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}
