import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile } from '../../types/models';

interface LeaderboardResponse {
  campaign: { name: string; start_date: string; end_date: string; top_n: number } | null;
  my_points: number;
  top_points: number[]; // anonymized: points only, no identity
}

export function LeaderboardScreen({ profile }: { profile: Profile }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await callFunction<LeaderboardResponse>('leaderboard', {
        profile_id: profile.id,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดกระดานผู้นำไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen scroll={false}>
      <BigText size="title" bold>
        🏆 กระดานผู้นำ
      </BigText>

      {error && <BigText style={styles.error}>{error}</BigText>}

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {!data?.campaign && !loading && (
          <BigText muted style={styles.empty}>
            ยังไม่มีรอบแข่งที่กำลังเปิดอยู่
          </BigText>
        )}

        {data?.campaign && (
          <>
            <View style={styles.campaignCard}>
              <BigText size="subtitle" bold>
                {data.campaign.name}
              </BigText>
              <BigText size="small" muted>
                {data.campaign.start_date} – {data.campaign.end_date} · รางวัล Top {data.campaign.top_n}
              </BigText>
            </View>

            <View style={styles.myCard}>
              <BigText size="body" muted>แต้มของฉันในรอบนี้</BigText>
              <BigText size="huge" bold style={styles.myPoints}>
                {data.my_points}
              </BigText>
            </View>

            <BigText size="subtitle" bold style={styles.sectionTitle}>
              แต้มสูงสุด (ไม่ระบุตัวบุคคล)
            </BigText>
            {data.top_points.map((points, idx) => (
              <View key={idx} style={styles.row}>
                <BigText size="body" muted>อันดับ {idx + 1}</BigText>
                <BigText size="title" bold>{points} แต้ม</BigText>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  empty: {
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  campaignCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  myCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  myPoints: {
    color: colors.primary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
