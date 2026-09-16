import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { BranchPicker } from '../../components/BranchPicker';
import { Screen } from '../../components/Screen';
import { callFunction } from '../../lib/supabase';
import { saveSession } from '../../lib/session';
import { colors, font, radius, spacing } from '../../theme/theme';
import { Branch, Profile } from '../../types/models';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (profile: Profile) => void }) {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ branches: Branch[] }>('list-branches', {})
      .then((res) => {
        setBranches(res.branches);
        if (res.branches.length > 0) setBranchId(res.branches[0].id);
      })
      .catch(() => {
        // ถ้าโหลดสาขาไม่ได้ ยังกด login ได้ (ใช้ได้กับผู้ใช้เดิมที่มีโปรไฟล์แล้ว)
      });
  }, []);

  const canSubmit = nickname.trim().length > 0 && phone.trim().length >= 9;

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await callFunction<{ profile: Profile }>('login', {
        nickname: nickname.trim(),
        phone: phone.trim(),
        branch_id: branchId,
      });
      await saveSession(result.profile);
      onLoggedIn(result.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <BigText size="huge" bold>
          ♻️ eStamp Recycle
        </BigText>
        <BigText size="subtitle" muted style={styles.subtitle}>
          สะสมขวด/กระป๋อง แยกขยะเพื่อองค์กร
        </BigText>
      </View>

      <View style={styles.form}>
        <BigText size="body" bold>ชื่อเล่น</BigText>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="เช่น เอ, บี, น้องมิ้ว"
          placeholderTextColor={colors.textMuted}
        />

        <BigText size="body" bold style={styles.fieldSpacing}>เบอร์โทร</BigText>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="0812345678"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />

        <BigText size="body" bold style={styles.fieldSpacing}>สาขา / DC (ใช้ตอนสมัครครั้งแรกเท่านั้น)</BigText>
        <BranchPicker branches={branches} selectedId={branchId} onSelect={setBranchId} />

        {error && (
          <BigText size="body" style={styles.error}>
            {error}
          </BigText>
        )}

        <BigButton
          label={loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          onPress={handleLogin}
          disabled={!canSubmit}
          loading={loading}
          style={styles.submit}
        />

        <BigText size="small" muted style={styles.hint}>
          ครั้งแรกที่ใช้ ระบบจะสร้างโปรไฟล์ให้อัตโนมัติด้วยชื่อเล่น+เบอร์นี้
        </BigText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    marginTop: spacing.md,
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  input: {
    marginTop: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.subtitle,
    color: colors.text,
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
  },
  submit: {
    marginTop: spacing.lg,
  },
  hint: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
