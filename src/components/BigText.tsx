import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, font } from '../theme/theme';

type Size = 'huge' | 'title' | 'subtitle' | 'body' | 'small';

export function BigText({
  size = 'body',
  muted = false,
  bold = false,
  style,
  ...rest
}: TextProps & { size?: Size; muted?: boolean; bold?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: font[size],
          color: muted ? colors.textMuted : colors.text,
          fontWeight: bold ? '700' : '400',
        },
        style,
      ]}
    />
  );
}
