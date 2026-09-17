import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { supabase, callFunction } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme/theme';
import { Profile, TransactionResult } from '../../types/models';

export function CameraScreen({
  profile,
  onCounted,
}: {
  profile: Profile;
  onCounted: (result: TransactionResult) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return (
      <Screen>
        <BigText>กำลังตรวจสอบสิทธิ์กล้อง...</BigText>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.permissionBox}>
          <BigText size="title" bold style={styles.center}>
            ต้องขออนุญาตใช้กล้อง
          </BigText>
          <BigText size="body" muted style={[styles.center, styles.permissionHint]}>
            เพื่อถ่ายรูปขวด/กระป๋องแล้วนับจำนวนอัตโนมัติ
          </BigText>
          <BigButton label="อนุญาตใช้กล้อง" onPress={requestPermission} style={styles.permissionButton} />
        </View>
      </Screen>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setError(null);
    setBusy(true);
    try {
      setStatusText('กำลังถ่ายรูป...');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      if (!photo?.uri) throw new Error('ถ่ายรูปไม่สำเร็จ');

      setStatusText('กำลังอัปโหลดรูป...');
      const uploadInfo = await callFunction<{ path: string; token: string }>('get-upload-url', {
        profile_id: profile.id,
      });

      const fileData = await new File(photo.uri).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .uploadToSignedUrl(uploadInfo.path, uploadInfo.token, fileData, {
          contentType: 'image/jpeg',
        });
      if (uploadError) throw new Error(uploadError.message);

      setStatusText('AI กำลังนับจำนวน...');
      const result = await callFunction<TransactionResult>('count-items', {
        profile_id: profile.id,
        branch_id: profile.branch_id,
        path: uploadInfo.path,
      });

      onCounted(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setBusy(false);
      setStatusText('');
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      </View>

      <BigText size="body" style={styles.instruction}>
        จัดขวด/กระป๋องให้อยู่ในเฟรม แล้วกดปุ่มถ่ายรูป
      </BigText>

      {error && (
        <BigText size="body" style={styles.error}>
          {error}
        </BigText>
      )}

      <BigButton
        label={busy ? statusText || 'กำลังประมวลผล...' : '📸 ถ่ายรูป'}
        onPress={handleCapture}
        loading={busy}
        style={styles.captureButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  camera: {
    flex: 1,
  },
  instruction: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  captureButton: {
    marginBottom: spacing.md,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  permissionHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  permissionButton: {
    marginTop: spacing.md,
  },
});
