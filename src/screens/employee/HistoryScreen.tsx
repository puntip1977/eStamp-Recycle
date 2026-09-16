import React, { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile } from '../../types/models';

interface HistoryItem {
  id: string;
  created_at: string;
  total_points: number;
  photo_url: string | null;
  items: { name: string; count: number }[];
}

export function HistoryScreen({ profile }: { profile: Profile }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await callFunction<{ transactions: HistoryItem[] }>('my-history', {
        profile_id: profile.id,
      });
      setHistory(res.transactions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดประวัติไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPoints = history.reduce((sum, t) => sum + t.total_points, 0);

  return (
    <Screen scroll={false}>
      <BigText size="title" bold>
        ประวัติของฉัน
      </BigText>
      <BigText size="subtitle" style={styles.totalRow}>
        แต้มสะสมรวม: <BigText size="subtitle" bold>{totalPoints}</BigText>
      </BigText>

      {error && <BigText style={styles.error}>{error}</BigText>}

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
      >
        {history.length === 0 && !loading && (
          <BigText muted style={styles.empty}>
            ยังไม่มีประวัติการถ่ายรูป
          </BigText>
        )}
        {history.map((item) => (
          <View key={item.id} style={styles.card}>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
            )}
            <View style={styles.cardBody}>
              <BigText size="small" muted>
                {new Date(item.created_at).toLocaleString('th-TH')}
              </BigText>
              <BigText size="body">
                {item.items.map((i) => `${i.name} ×${i.count}`).join(', ') || 'ไม่พบรายการ'}
              </BigText>
              <BigText size="subtitle" bold style={styles.points}>
                +{item.total_points} แต้ม
              </BigText>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  empty: {
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 84,
    height: 84,
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  points: {
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
