import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { BigText } from '../../components/BigText';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing } from '../../theme/theme';
import { TransactionResult } from '../../types/models';

export function ResultScreen({
  result,
  onDone,
}: {
  result: TransactionResult;
  onDone: () => void;
}) {
  const hasItems = result.items.length > 0;

  return (
    <Screen>
      <BigText size="huge" bold style={styles.center}>
        {hasItems ? '✅ นับสำเร็จ!' : '🤔 ไม่พบขวด/กระป๋อง'}
      </BigText>

      {hasItems ? (
        <View style={styles.list}>
          {result.items.map((item) => (
            <View key={item.item_type_id} style={styles.row}>
              <BigText size="title">{item.name}</BigText>
              <BigText size="title" bold>
                × {item.count}
              </BigText>
            </View>
          ))}
        </View>
      ) : (
        <BigText size="body" muted style={styles.center}>
          ลองถ่ายรูปใหม่ให้เห็นขวด/กระป๋องชัดเจนขึ้น
        </BigText>
      )}

      <View style={styles.pointsBox}>
        <BigText size="subtitle" muted style={styles.center}>
          แต้มที่ได้รับ
        </BigText>
        <BigText size="huge" bold style={[styles.center, styles.pointsValue]}>
          +{result.total_points}
        </BigText>
      </View>

      <BigButton label="ถ่ายรูปต่อไป" onPress={onDone} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  list: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  pointsBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pointsValue: {
    color: colors.primary,
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.xl,
  },
});
