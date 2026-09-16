import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile } from '../../types/models';

interface ReportResponse {
  total_points: number;
  total_transactions: number;
  by_branch: { branch_name: string; points: number }[];
  by_item_type: { item_type_name: string; count: number; points: number }[];
}

export function AdminDashboardScreen({ profile }: { profile: Profile }) {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await callFunction<ReportResponse>('admin-reports', {
        profile_id: profile.id,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายงานไม่สำเร็จ');
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
        📊 รายงานรวมองค์กร
      </BigText>
      {error && <BigText style={styles.error}>{error}</BigText>}

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {data && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <BigText size="small" muted>แต้มรวมทั้งหมด</BigText>
                <BigText size="title" bold>{data.total_points}</BigText>
              </View>
              <View style={styles.summaryCard}>
                <BigText size="small" muted>จำนวนครั้งที่ถ่าย</BigText>
                <BigText size="title" bold>{data.total_transactions}</BigText>
              </View>
            </View>

            <BigText size="subtitle" bold style={styles.sectionTitle}>
              แยกตามสาขา
            </BigText>
            {data.by_branch.map((b) => (
              <View key={b.branch_name} style={styles.row}>
                <BigText size="body">{b.branch_name}</BigText>
                <BigText size="body" bold>{b.points} แต้ม</BigText>
              </View>
            ))}

            <BigText size="subtitle" bold style={styles.sectionTitle}>
              แยกตามประเภทขยะ
            </BigText>
            {data.by_item_type.map((i) => (
              <View key={i.item_type_name} style={styles.row}>
                <BigText size="body">{i.item_type_name}</BigText>
                <BigText size="body" bold>
                  {i.count} ชิ้น · {i.points} แต้ม
                </BigText>
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
