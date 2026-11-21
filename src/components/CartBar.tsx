import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice } from '../data/menu';
import { cartCount, cartTotal, useStore } from '../store';
import { colors, fonts, radius, shadow, space } from '../theme';
import { Icon } from './Icon';
import { tap } from './ui';

/** Sepette ürün varken ekranın altında yüzen özet çubuğu. */
export function CartBar() {
  const cart = useStore((s) => s.cart);
  const count = cartCount(cart);
  if (!count) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          tap();
          router.push('/cart');
        }}
        style={({ pressed }) => [styles.bar, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
        <Text style={styles.title}>Sepeti gör</Text>
        <Text style={styles.total}>{formatPrice(cartTotal(cart))}</Text>
        <Icon name="chevron-right" size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
  bar: {
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.seaDeep,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.md,
    ...shadow.card,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 13 },
  title: { flex: 1, fontFamily: fonts.bodySemi, color: colors.white, fontSize: 15 },
  total: { fontFamily: fonts.bodySemi, color: colors.white, fontSize: 15 },
});
