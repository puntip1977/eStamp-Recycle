import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile, Reward } from '../../types/models';

export function AdminRewardsScreen({ profile }: { profile: Profile }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await callFunction<{ rewards: Reward[] }>('admin-rewards-crud', {
        profile_id: profile.id,
        action: 'list',
      });
      setRewards(res.rewards);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await callFunction('admin-rewards-crud', {
        profile_id: profile.id,
        action: 'create',
        name: name.trim(),
        description: description.trim() || null,
      });
      setName('');
      setDescription('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เพิ่มของรางวัลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (reward: Reward) => {
    try {
      await callFunction('admin-rewards-crud', {
        profile_id: profile.id,
        action: 'update',
        id: reward.id,
        active: !reward.active,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'แก้ไขไม่สำเร็จ');
    }
  };

  return (
    <Screen scroll={false}>
      <BigText size="title" bold>
        🎁 จัดการของรางวัล
      </BigText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="ชื่อของรางวัล"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, styles.formSpacing]}
          placeholder="รายละเอียด (ไม่บังคับ)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
        {error && <BigText style={styles.error}>{error}</BigText>}
        <BigButton
          label={saving ? 'กำลังบันทึก...' : '+ เพิ่มของรางวัล'}
          onPress={handleAdd}
          loading={saving}
          disabled={!name.trim()}
          style={styles.formSpacing}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rewards.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardBody}>
              <BigText size="subtitle" bold>{r.name}</BigText>
              {r.description && <BigText size="small" muted>{r.description}</BigText>}
            </View>
            <BigButton
              label={r.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              variant={r.active ? 'primary' : 'secondary'}
              onPress={() => handleToggle(r)}
              style={styles.toggleButton}
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleButton: {
    minHeight: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
