import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BigText } from '../../components/BigText';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile } from '../../types/models';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminRewardsScreen } from './AdminRewardsScreen';
import { AdminRulesScreen } from './AdminRulesScreen';
import { AdminCampaignsScreen } from './AdminCampaignsScreen';

const SECTIONS = [
  { key: 'dashboard', label: 'รายงาน' },
  { key: 'rewards', label: 'ของรางวัล' },
  { key: 'rules', label: 'เงื่อนไขแต้ม' },
  { key: 'campaigns', label: 'รอบแข่ง' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function AdminHomeScreen({ profile }: { profile: Profile }) {
  const [section, setSection] = useState<SectionKey>('dashboard');

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {SECTIONS.map((s) => (
          <BigText
            key={s.key}
            size="body"
            bold={section === s.key}
            onPress={() => setSection(s.key)}
            style={[styles.tabItem, section === s.key && styles.tabItemActive]}
          >
            {s.label}
          </BigText>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {section === 'dashboard' && <AdminDashboardScreen profile={profile} />}
        {section === 'rewards' && <AdminRewardsScreen profile={profile} />}
        {section === 'rules' && <AdminRulesScreen profile={profile} />}
        {section === 'campaigns' && <AdminCampaignsScreen profile={profile} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tabItemActive: {
    color: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
  },
});
