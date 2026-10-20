import { useState } from 'react';
import { StyleSheet, Text, TextProps, View } from 'react-native';

/** Measure the space left by labels/controls, rather than shrinking native text. */
export function LargeNumber({ value, color, liveRegion = 'none' }: {
  value: string; color: string; liveRegion?: TextProps['accessibilityLiveRegion'];
}) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Reserve two columns for scores so 9 -> 10 does not change their size.
  const columns = Math.max(2, value.length);
  const fontSize = Math.max(1, Math.floor(Math.min(area.height / 1.12, area.width / (columns * 0.68))));
  return <View pointerEvents="none" style={styles.area} onLayout={({ nativeEvent: { layout } }) => {
    setArea(previous => previous.width === layout.width && previous.height === layout.height
      ? previous : { width: layout.width, height: layout.height });
  }}>
    {area.width > 0 && area.height > 0 && <Text
      accessibilityLiveRegion={liveRegion}
      allowFontScaling={false}
      adjustsFontSizeToFit={false}
      numberOfLines={1}
      style={[styles.number, { color, fontSize, lineHeight: Math.ceil(fontSize * 1.1) }]}
    >{value}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  area: { flex: 1, minHeight: 0, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  number: { fontWeight: '800', fontVariant: ['tabular-nums'], textAlign: 'center', includeFontPadding: false, flexShrink: 0 },
});
