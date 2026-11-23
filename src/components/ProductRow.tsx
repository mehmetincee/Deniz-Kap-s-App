import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice, isOrderableService, serviceOf, type Product } from '../data/menu';
import { colors, font, radius, space, textStyle } from '../theme';
import { Icon } from './Icon';
import { tap } from './ui';

export function ProductRow({ product }: { product: Product }) {
  const orderable = isOrderableService(serviceOf(product.id)) && !product.askWaiter;
  const open = () => {
    tap();
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`} onPress={open} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1, paddingRight: space.md }}>
        <Text style={styles.name}>{product.name}</Text>
        {!!product.nameEn && !product.nameEn.includes(',') && <Text style={styles.en}>{product.nameEn}</Text>}
        {!!product.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        <Text style={styles.price}>
          {product.askWaiter ? 'Garsona sorunuz' : product.options ? `${formatPrice(product.price)}'den` : formatPrice(product.price)}
        </Text>
      </View>
      {product.image ? (
        <View>
          <Image source={product.image} style={styles.image} contentFit="cover" transition={200} />
          {orderable && (
            <View style={[styles.add, styles.addOnImage]}>
              <Icon name="plus" size={14} color={colors.accent} strokeWidth={2.2} weight="bold" />
            </View>
          )}
        </View>
      ) : orderable ? (
        <View style={styles.add}>
          <Icon name="plus" size={14} color={colors.accent} strokeWidth={2.2} weight="bold" />
        </View>
      ) : (
        <Icon name="chevron-right" size={14} color={colors.tertiaryLabel} weight="semibold" />
      )}
    </Pressable>
  );
}

// [lists-and-tables › Content] kısa ad + en fazla 2 satır açıklama; ayrıntı, satıra dokununca açılan sayfada.
// [typography] ad: New York (headline boyutu), açıklama: SF subhead + secondaryLabel.
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md + 2,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  name: { ...font.serifBold, ...textStyle.headline, color: colors.label },
  en: { ...font.serifItalic, ...textStyle.subhead, color: colors.secondaryLabel },
  desc: { ...font.regular, ...textStyle.subhead, color: colors.secondaryLabel, marginTop: 4 },
  price: { ...font.semibold, ...textStyle.subhead, color: colors.label, marginTop: 6 },
  image: { width: 88, height: 88, borderRadius: radius.md },
  add: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnImage: { position: 'absolute', right: 6, bottom: 6, backgroundColor: colors.secondaryGroupedBackground },
});
