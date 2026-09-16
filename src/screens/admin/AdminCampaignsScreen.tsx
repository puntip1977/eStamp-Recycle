import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Campaign, Profile, Reward } from '../../types/models';

interface Winner {
  profile_id: string;
  nickname: string;
  rank: number;
  points: number;
  reward_id: string | null;
  reward_name: string | null;
}

export function AdminCampaignsScreen({ profile }: { profile: Profile }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [winnersByCampaign, setWinnersByCampaign] = useState<Record<string, Winner[]>>({});
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topN, setTopN] = useState('3');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [campaignRes, rewardRes] = await Promise.all([
        callFunction<{ campaigns: Campaign[] }>('admin-campaigns', {
          profile_id: profile.id,
          action: 'list',
        }),
        callFunction<{ rewards: Reward[] }>('admin-rewards-crud', {
          profile_id: profile.id,
          action: 'list',
        }),
      ]);
      setCampaigns(campaignRes.campaigns);
      setRewards(rewardRes.rewards.filter((r) => r.active));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const n = Number(topN);
    if (!name.trim() || !startDate.trim() || !endDate.trim() || Number.isNaN(n)) return;
    try {
      await callFunction('admin-campaigns', {
        profile_id: profile.id,
        action: 'create',
        name: name.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        top_n: n,
      });
      setName('');
      setStartDate('');
      setEndDate('');
      setTopN('3');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้างรอบแข่งไม่สำเร็จ');
    }
  };

  const handleFinalize = async (campaignId: string) => {
    try {
      const res = await callFunction<{ winners: Winner[] }>('admin-campaigns', {
        profile_id: profile.id,
        action: 'finalize',
        id: campaignId,
      });
      setWinnersByCampaign((w) => ({ ...w, [campaignId]: res.winners }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สรุปผลไม่สำเร็จ');
    }
  };

  const handleAssignReward = async (campaignId: string, profileId: string, rewardId: string) => {
    try {
      await callFunction('admin-campaigns', {
        profile_id: profile.id,
        action: 'assign-reward',
        campaign_id: campaignId,
        winner_profile_id: profileId,
        reward_id: rewardId,
      });
      const res = await callFunction<{ winners: Winner[] }>('admin-campaigns', {
        profile_id: profile.id,
        action: 'get-winners',
        id: campaignId,
      });
      setWinnersByCampaign((w) => ({ ...w, [campaignId]: res.winners }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'มอบรางวัลไม่สำเร็จ');
    }
  };

  return (
    <Screen scroll={false}>
      <BigText size="title" bold>
        🏁 จัดการรอบแข่ง
      </BigText>
      {error && <BigText style={styles.error}>{error}</BigText>}

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="ชื่อรอบแข่ง เช่น แข่งเดือนกันยายน"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.formSpacing]}
            placeholder="วันเริ่ม (YYYY-MM-DD)"
            placeholderTextColor={colors.textMuted}
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={[styles.input, styles.formSpacing]}
            placeholder="วันสิ้นสุด (YYYY-MM-DD)"
            placeholderTextColor={colors.textMuted}
            value={endDate}
            onChangeText={setEndDate}
          />
          <TextInput
            style={[styles.input, styles.formSpacing]}
            placeholder="จำนวนผู้ชนะ (Top N)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={topN}
            onChangeText={setTopN}
          />
          <BigButton label="+ สร้างรอบแข่ง" onPress={handleCreate} style={styles.formSpacing} />
        </View>

        {campaigns.map((c) => (
          <View key={c.id} style={styles.card}>
            <BigText size="subtitle" bold>{c.name}</BigText>
            <BigText size="small" muted>
              {c.start_date} – {c.end_date} · Top {c.top_n} · {c.status === 'active' ? 'กำลังแข่ง' : 'ปิดแล้ว'}
            </BigText>

            {c.status === 'active' && (
              <BigButton
                label="ปิดรอบ + สรุปผลผู้ชนะ"
                onPress={() => handleFinalize(c.id)}
                variant="secondary"
                style={styles.formSpacing}
              />
            )}

            {winnersByCampaign[c.id]?.map((w) => (
              <View key={w.profile_id} style={styles.winnerRow}>
                <BigText size="body">
                  #{w.rank} {w.nickname} · {w.points} แต้ม
                </BigText>
                <BigText size="small" muted>
                  รางวัล: {w.reward_name ?? 'ยังไม่กำหนด'}
                </BigText>
                <View style={styles.rewardChips}>
                  {rewards.map((r) => (
                    <BigButton
                      key={r.id}
                      label={r.name}
                      variant={w.reward_id === r.id ? 'primary' : 'secondary'}
                      onPress={() => handleAssignReward(c.id, w.profile_id, r.id)}
                      style={styles.rewardChip}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  formSpacing: {
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    color: colors.text,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  winnerRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  rewardChip: {
    minHeight: 40,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
