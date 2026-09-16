import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { ItemType, Profile } from '../../types/models';

export function AdminRulesScreen({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<ItemType[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await callFunction<{ item_types: ItemType[] }>('admin-rules-crud', {
        profile_id: profile.id,
        action: 'list',
      });
      setItems(res.item_types);
      setDrafts(Object.fromEntries(res.item_types.map((i) => [i.id, String(i.points_per_unit)])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (id: string) => {
    const value = Number(drafts[id]);
    if (Number.isNaN(value) || value < 0) return;
    try {
      await callFunction('admin-rules-crud', {
        profile_id: profile.id,
        action: 'update',
        id,
        points_per_unit: value,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const handleAdd = async () => {
    const value = Number(newPoints);
    if (!newName.trim() || Number.isNaN(value)) return;
    try {
      await callFunction('admin-rules-crud', {
        profile_id: profile.id,
        action: 'create',
        name: newName.trim(),
        points_per_unit: value,
      });
      setNewName('');
      setNewPoints('1');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เพิ่มไม่สำเร็จ');
    }
  };

  return (
    <Screen scroll={false}>
      <BigText size="title" bold>
        ⚙️ เงื่อนไขการสะสมแต้ม
      </BigText>
      {error && <BigText style={styles.error}>{error}</BigText>}

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <BigText size="subtitle" style={styles.cardName}>
              {item.icon ? `${item.icon} ` : ''}{item.name}
            </BigText>
            <TextInput
              style={styles.pointsInput}
              keyboardType="numeric"
              value={drafts[item.id] ?? ''}
              onChangeText={(v) => setDrafts((d) => ({ ...d, [item.id]: v }))}
            />
            <BigButton label="บันทึก" onPress={() => handleSave(item.id)} style={styles.saveButton} />
          </View>
        ))}

        <View style={styles.addCard}>
          <BigText size="subtitle" bold style={styles.formSpacing}>
            เพิ่มประเภทขยะใหม่
          </BigText>
          <TextInput
            style={[styles.input, styles.formSpacing]}
            placeholder="ชื่อประเภท เช่น กระดาษ"
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={[styles.input, styles.formSpacing]}
            placeholder="แต้มต่อหน่วย"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={newPoints}
            onChangeText={setNewPoints}
          />
          <BigButton
            label="+ เพิ่มประเภทขยะ"
            onPress={handleAdd}
            disabled={!newName.trim()}
            style={styles.formSpacing}
          />
        </View>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardName: {
    flex: 1,
  },
  pointsInput: {
    width: 64,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 18,
    marginRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  saveButton: {
    minHeight: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  addCard: {
    marginTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
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
});
