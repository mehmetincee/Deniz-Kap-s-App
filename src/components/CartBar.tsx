import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice } from '../data/menu';
import { cartCount, cartTotal, useStore } from '../store';
import { colors, font, radius, shadow, space, textStyle } from '../theme';
import { Icon } from './Icon';
import { Material, tap } from './ui';

/**
 * iOS 26+: sepet, sekme çubuğunun alt aksesuarıdır (Müzik'teki MiniPlayer gibi).
 * [tab-bars › iOS] "For tab bars with an attached accessory, like the MiniPlayer in Music, you can choose to minimize
 *   the tab bar and move the accessory inline with it when a person scrolls down."
 * Bu durumda ekranlardaki yüzen çubuk gösterilmez.
 */
export const cartUsesTabAccessory = Platform.OS === 'ios' && isLiquidGlassAvailable();

/** Sekme çubuğu aksesuarı içeriği (iOS 26+). Aksesuar zaten Liquid Glass üzerinde durur; ek zemin çizilmez. */
export function CartAccessory() {
  const cart = useStore((s) => s.cart);
  const count = cartCount(cart);
  const total = formatPrice(cartTotal(cart));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sepeti gör, ${count} ürün, ${total}`}
      onPress={() => (tap(), router.push('/cart'))}
      style={styles.accessory}
    >
      <Icon name="bag" size={18} color={colors.accent} weight="semibold" />
      <Text style={[styles.title, { color: colors.label }]}>Sepet · {count} ürün</Text>
      <Text style={[styles.total, { color: colors.label }]}>{total}</Text>
    </Pressable>
  );
}

/**
 * iOS 26 öncesi, Android ve web: sekme çubuğunun üstünde yüzen sepet çubuğu.
 * [materials › Liquid Glass] kontrol katmanında yüzer; [color › Liquid Glass color] "To emphasize primary actions,
 *   apply color to the background rather than to symbols or text" → vurgu rengiyle renklendirilmiş zemin.
 * [tab-bars] "Make sure the tab bar is visible" → çubuk sekme çubuğunu kapatmaz.
 */
export function CartBar() {
  const insets = useSafeAreaInsets();
  const cart = useStore((s) => s.cart);
  const count = cartCount(cart);
  if (!count || cartUsesTabAccessory) return null;
  const total = formatPrice(cartTotal(cart));
  // iOS (26 öncesi): içerik yarı saydam sekme çubuğunun altına uzanır → standart 49 pt sekme yüksekliği kadar yukarıda.
  const bottom = Platform.OS === 'ios' ? insets.bottom + 49 + space.sm : space.sm;
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sepeti gör, ${count} ürün, ${total}`}
        onPress={() => (tap(), router.push('/cart'))}
        style={({ pressed }) => [styles.bar, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <Material tint={colors.accent} interactive style={StyleSheet.absoluteFill} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
        <Text style={styles.title}>Sepeti gör</Text>
        <Text style={styles.total}>{total}</Text>
        <Icon name="chevron-right" size={14} color={colors.onAccent} weight="semibold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  bar: { height: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md, ...shadow.floating },
  accessory: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...font.semibold, ...textStyle.footnote, color: colors.onAccent },
  title: { flex: 1, ...font.semibold, ...textStyle.subhead, color: colors.onAccent },
  total: { ...font.semibold, ...textStyle.subhead, color: colors.onAccent },
});
