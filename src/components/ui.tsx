import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow, space, type } from '../theme';
import { Icon, type IconName } from './Icon';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  bottomInset = 24,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  bottomInset?: number;
}) {
  const insets = useSafeAreaInsets();
  const content = [padded && { paddingHorizontal: space.xl }, { paddingTop: insets.top + space.md, paddingBottom: bottomInset }, style];
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.sand }, ...content]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.sand }} contentContainerStyle={content} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export function T({
  v = 'body',
  style,
  children,
  numberOfLines,
}: {
  v?: keyof typeof type;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={[type[v], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  right,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  right?: ReactNode;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={v.fg} />}
          <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>
          {right}
        </>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { bg: colors.seaDeep, fg: colors.white, border: colors.seaDeep },
  secondary: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  ghost: { bg: 'transparent', fg: colors.sea, border: 'transparent' },
  light: { bg: colors.white, fg: colors.seaDeep, border: colors.white },
};

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable
        onPress={() => {
          tap();
          onPress();
        }}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.92 }]}
      >
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({ label, active, onPress, style }: { label: string; active?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, active && styles.chipActive, style]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 0, small }: { value: number; onChange: (n: number) => void; min?: number; small?: boolean }) {
  const s = small ? 30 : 40;
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel="Azalt"
        onPress={() => {
          tap();
          onChange(Math.max(min, value - 1));
        }}
        style={[styles.stepBtn, { width: s, height: s }]}
      >
        <Icon name="minus" size={small ? 14 : 18} />
      </Pressable>
      <Text style={[styles.stepValue, small && { fontSize: 14, minWidth: 20 }]}>{value}</Text>
      <Pressable
        accessibilityLabel="Arttır"
        onPress={() => {
          tap();
          onChange(value + 1);
        }}
        style={[styles.stepBtn, { width: s, height: s }]}
      >
        <Icon name="plus" size={small ? 14 : 18} />
      </Pressable>
    </View>
  );
}

export function SectionTitle({ label, title, action, onAction }: { label?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        {label && <T v="label">{label}</T>}
        <T v="h2" style={{ marginTop: label ? 4 : 0 }}>
          {title}
        </T>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress && (() => (tap(), onPress()))}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.6 }]}
    >
      {icon && (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={19} color={colors.sea} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <T v="h3">{title}</T>
        {subtitle && <T v="small">{subtitle}</T>}
      </View>
      {right ?? (onPress && <Icon name="chevron-right" size={18} color={colors.muted} />)}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

export function IconButton({ name, onPress, style, label }: { name: IconName; onPress: () => void; style?: StyleProp<ViewStyle>; label: string }) {
  return (
    <Pressable accessibilityLabel={label} onPress={() => (tap(), onPress())} hitSlop={8} style={[styles.iconButton, style]}>
      <Icon name={name} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  buttonText: { fontFamily: fonts.bodySemi, fontSize: 15, letterSpacing: 0.2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepValue: { fontFamily: fonts.bodySemi, fontSize: 17, minWidth: 26, textAlign: 'center', color: colors.ink },
  sectionTitle: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.md },
  action: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.sea },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.foam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
