import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Children, isValidElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../i18n';
import { colors, font, hit, radius, space, textStyle, type } from '../theme';
import { Icon, type IconName } from './Icon';

/** [feedback] Seçimlerde hafif dokunsal geri bildirim (yalnızca cihazda). */
export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

/** Liquid Glass yalnızca iOS 26+ cihazlarda; diğerlerinde sistem bulanıklık malzemesi. */
const glassAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Ekran kabı.
 * [layout › Guides and safe areas] güvenli alana uyulur. Üstte yerel gezinme çubuğu varsa
 * içerik onun altından kayar (contentInsetAdjustmentBehavior="automatic") ve sistem
 * kaydırma kenarı efektini uygular [layout › Differentiate controls from content].
 * [color › iOS] gruplanmış içerikli ekranların zemini systemGroupedBackground.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  bottomInset = 32,
  topInset = false,
  background = colors.groupedBackground,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  bottomInset?: number;
  /** Gezinme çubuğu olmayan ekranlarda (karşılama, fotoğraflı üst alan) durum çubuğu payı. */
  topInset?: boolean;
  background?: ColorValue;
}) {
  const insets = useSafeAreaInsets();
  const content = [
    padded && { paddingHorizontal: space.lg },
    { paddingTop: topInset ? insets.top + space.md : space.sm, paddingBottom: bottomInset + insets.bottom },
    style,
  ];
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: background }, ...content]}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function T({ v = 'body', style, children, numberOfLines }: { v?: keyof typeof type; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number }) {
  return (
    <Text style={[type[v], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

/**
 * Düğme.
 * [buttons] "use a button that has a prominent visual style for the most likely action… Keep the number
 *   of prominent buttons to one or two per view." → primary: vurgu rengi zeminli kapsül.
 * [buttons] "prefer… capsule-shape buttons"; yükseklik Large (52 pt); dokunma alanı ≥ 44x44 pt.
 * [buttons] "Use style — not size — to visually distinguish the preferred choice" → secondary: gri dolgulu,
 *   vurgu renkli yazı; ghost: düz metin (borderless).
 * [buttons › destructive] yıkıcı eylem systemRed.
 */
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'light' | 'destructive';
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
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        variant === 'ghost' && { paddingHorizontal: space.sm },
        (disabled || loading) && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={v.fg} weight="semibold" />}
          <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>
          {right}
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<string, { bg: ColorValue; fg: ColorValue }> = {
  primary: { bg: colors.accent, fg: colors.onAccent },
  secondary: { bg: colors.fill, fg: colors.accent },
  ghost: { bg: 'transparent', fg: colors.accent },
  light: { bg: colors.onAccent, fg: colors.accent },
  destructive: { bg: colors.fill, fg: colors.red },
};

/**
 * İçerik kartı: gruplanmış liste hücresi görünümü (secondarySystemGroupedBackground, gölgesiz).
 * [materials] "Don't use Liquid Glass in the content layer" → kartlar düz sistem yüzeyi.
 */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={() => (tap(), onPress())} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.7 }]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Kapsül seçici. Görünen yükseklik 34 pt, dokunma alanı hitSlop ile 44 pt [accessibility]. */
export function Chip({ label, active, onPress, style }: { label: string; active?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      hitSlop={5}
      onPress={() => (tap(), onPress())}
      style={[styles.chip, active && styles.chipActive, style]}
    >
      <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

/** Adet seçici: her düğme ≥ 44 pt dokunma alanı [buttons], [accessibility]. */
export function Stepper({ value, onChange, min = 0, small }: { value: number; onChange: (n: number) => void; min?: number; small?: boolean }) {
  const s = small ? 32 : hit;
  const slop = (hit - s) / 2;
  const { t } = useT();
  return (
    <View style={styles.stepper} accessibilityRole="adjustable" accessibilityValue={{ now: value }}>
      <Pressable accessibilityLabel={t('common.decrease')} hitSlop={slop} onPress={() => (tap(), onChange(Math.max(min, value - 1)))} style={[styles.stepBtn, { width: s, height: s }]}>
        <Icon name="minus" size={small ? 14 : 17} color={colors.accent} weight="semibold" />
      </Pressable>
      <Text style={[styles.stepValue, small && { ...textStyle.subhead, minWidth: 22 }]}>{value}</Text>
      <Pressable accessibilityLabel={t('common.increase')} hitSlop={slop} onPress={() => (tap(), onChange(value + 1))} style={[styles.stepBtn, { width: s, height: s }]}>
        <Icon name="plus" size={small ? 14 : 17} color={colors.accent} weight="semibold" />
      </Pressable>
    </View>
  );
}

/** İçerik bölümü başlığı. [layout › Visual hierarchy] önemli içerik üstte, başlıklarla gruplanır. */
export function SectionTitle({ label, title, action, onAction }: { label?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        {label && <T v="label">{label}</T>}
        <T v="h2" style={{ marginTop: label ? 2 : 0 }}>
          {title}
        </T>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Gruplanmış liste bölümü (Ayarlar uygulaması düzeni).
 * [lists-and-tables › Style] "the grouped style uses headers, footers, and additional space to separate groups of data"
 * [color › iOS] grouped table → secondarySystemGroupedBackground hücreler, ayırıcılar `separator`.
 */
export function ListSection({ header, footer, children, style }: { header?: string; footer?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[{ marginTop: space.xl }, style]}>
      {header && <Text style={styles.listHeader}>{header}</Text>}
      <View style={styles.list}>
        {items.map((child, i) => (
          <View key={i}>
            {child}
            {i < items.length - 1 && <View style={styles.listSeparator} />}
          </View>
        ))}
      </View>
      {footer && <Text style={styles.listFooter}>{footer}</Text>}
    </View>
  );
}

/**
 * Liste satırı: en az 44 pt yükseklik [buttons/accessibility], ön tarafta renkli kare içinde simge,
 * sonda gezinme göstergesi (chevron, tertiaryLabel).
 * [lists-and-tables] "Keep item text succinct"; başlık body, alt satır footnote.
 */
export function Row({
  icon,
  iconColor = colors.accent,
  title,
  subtitle,
  onPress,
  right,
  destructive,
}: {
  icon?: IconName;
  iconColor?: ColorValue;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress && (() => (tap(), onPress()))}
      style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.fill }]}
    >
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconColor }]}>
          <Icon name={icon} size={17} color={colors.onAccent} weight="medium" />
        </View>
      )}
      <View style={{ flex: 1, paddingVertical: subtitle ? 10 : 0 }}>
        <Text style={[styles.rowTitle, destructive && { color: colors.red }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && !destructive && <Icon name="chevron-right" size={14} color={colors.tertiaryLabel} weight="semibold" />)}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }, style]} />;
}

/**
 * Yuvarlak simge düğmesi (Kapat, Geri, Favori).
 * [toolbars] "Use the standard Back and Close buttons… Prefer the standard symbols… don't use a text label"
 * [materials › Liquid Glass] kontroller içerikten ayrı, Liquid Glass katmanında; fotoğraf üstünde
 *   "clear" varyant [materials: "Only use clear Liquid Glass for components that appear over visually rich backgrounds"].
 * Liquid Glass olmayan sistemlerde sistem malzemesi (blur) kullanılır.
 * 44x44 pt [buttons].
 */
export function IconButton({
  name,
  onPress,
  style,
  label,
  overMedia,
  color = colors.label,
}: {
  name: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label: string;
  overMedia?: boolean;
  color?: ColorValue;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => (tap(), onPress())} style={[styles.iconButton, style]}>
      <Material variant={overMedia ? 'clear' : 'regular'} style={StyleSheet.absoluteFill} interactive />
      <Icon name={name} size={17} color={color} weight="semibold" />
    </Pressable>
  );
}

/**
 * Kontrol katmanı malzemesi: Liquid Glass (iOS 26+), yoksa sistem kalın bulanıklık malzemesi.
 * [materials] "Use Liquid Glass effects sparingly… Limit these effects to the most important functional elements."
 */
export function Material({
  variant = 'regular',
  style,
  interactive,
  tint,
}: {
  variant?: 'regular' | 'clear';
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  tint?: ColorValue;
}) {
  if (glassAvailable) return <GlassView glassEffectStyle={variant} isInteractive={interactive} tintColor={tint} style={[{ borderRadius: radius.pill }, style]} />;
  if (tint) return <View style={[{ borderRadius: radius.pill, backgroundColor: tint }, style]} />;
  return (
    <BlurView
      tint={variant === 'clear' ? 'systemUltraThinMaterial' : 'systemChromeMaterial'}
      intensity={Platform.OS === 'web' ? 60 : 90}
      style={[{ borderRadius: radius.pill, overflow: 'hidden', backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.72)' : undefined }, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: hit,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonText: { ...font.semibold, ...textStyle.headline },
  card: { backgroundColor: colors.secondaryGroupedBackground, borderRadius: radius.xl, padding: space.lg },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { ...font.medium, ...textStyle.subhead, color: colors.label },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill },
  stepValue: { ...font.semibold, ...textStyle.headline, minWidth: 26, textAlign: 'center', color: colors.label },
  sectionTitle: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.md },
  action: { ...font.regular, ...textStyle.body, color: colors.accent },
  list: { backgroundColor: colors.secondaryGroupedBackground, borderRadius: radius.xl, overflow: 'hidden' },
  listHeader: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginHorizontal: space.lg, marginBottom: 7 },
  listFooter: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginHorizontal: space.lg, marginTop: 7 },
  // Ayırıcı, simgenin bittiği yerden başlar (satır içeriğiyle hizalı) [layout › Align elements]
  listSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: space.lg + 30 + space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hit + 8, paddingHorizontal: space.lg },
  rowIcon: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...font.regular, ...textStyle.body, color: colors.label },
  rowSubtitle: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: 1 },
  iconButton: { width: hit, height: hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});

/**
 * iOS segment kontrolü görünümü: gri iz, seçili bölmede beyaz "başparmak".
 * [segmented-controls] "no more than about five segments on iPhone"; bölmeler eşit genişlikte;
 * yalnızca seçim gösterir, eylem içermez ("Keep control types consistent").
 */
export function Segmented<V extends string | number>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: V; label: string; icon?: IconName }[];
  value: V;
  onChange: (v: V) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[segStyles.track, style]} accessibilityRole="tablist">
      {options.slice(0, 5).map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => (tap(), onChange(o.value))}
            style={[segStyles.item, active && segStyles.active]}
          >
            {o.icon && <Icon name={o.icon} size={15} color={colors.label} weight={active ? 'semibold' : 'regular'} />}
            <Text style={[segStyles.text, active && { ...font.semibold }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 9, padding: 2 },
  item: { flex: 1, minHeight: 32, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  active: {
    backgroundColor: colors.secondaryGroupedBackground,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: { ...font.medium, ...textStyle.footnote, color: colors.label },
});
