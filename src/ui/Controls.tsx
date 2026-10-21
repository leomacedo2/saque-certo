import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from './theme';

export function Button({ label, onPress, secondary = false, disabled = false, accessibilityLabel, large = false }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; accessibilityLabel?: string; large?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, large && styles.largeButton, secondary && styles.secondary, disabled && { opacity: 0.35 }, pressed && { opacity: 0.7 }]}>
    <Text style={[styles.buttonText, large && { fontSize: 18 }, secondary && { color: palette.text }]}>{label}</Text>
  </Pressable>;
}
export function Dialog({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return <View style={styles.veil} accessibilityViewIsModal>
    <ScrollView style={styles.dialogScroll} contentContainerStyle={styles.dialogContainer} bounces={false}>
      <View style={styles.dialog}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {children}
      </View>
    </ScrollView>
  </View>;
}
export const shared = StyleSheet.create({
  body: { fontSize: 16, color: palette.muted, lineHeight: 23 },
  strong: { fontSize: 18, color: palette.text, fontWeight: '700', lineHeight: 25 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
});
const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: palette.green, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  largeButton: { minHeight: 64, paddingHorizontal: 28 },
  secondary: { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1 },
  buttonText: { color: '#10271D', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: '#040810EF', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  dialogScroll: { width: '100%', maxWidth: 680 },
  dialogContainer: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  dialog: { backgroundColor: palette.background, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: palette.line, gap: 8 },
  eyebrow: { color: palette.warning, fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  title: { color: palette.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
});
