import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ordering } from '../config/restaurant';
import { formatPrice, isOrderableService, localize, serviceOf, type Product } from '../data/menu';
import { useT } from '../i18n';
import { colors, font, radius, space, textStyle } from '../theme';
import { Icon } from './Icon';
import { tap } from './ui';

export function ProductRow({ product }: { product: Product }) {
  const orderable = ordering.enabled && isOrderableService(serviceOf(product.id)) && !product.askWaiter;
  const { t, lang } = useT();
  const l = localize(product, lang);
  const priceText = product.askWaiter ? t('menu.askWaiter') : product.options ? t('menu.from', { price: formatPrice(product.price) }) : formatPrice(product.price);
  const open = () => {
    tap();
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${l.title}, ${priceText}`} onPress={open} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1, paddingRight: space.md }}>
        <Text style={styles.name}>{l.title}</Text>
        {!!l.alt && <Text style={styles.en}>{l.alt}</Text>}
        {!!l.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {l.description}
          </Text>
        )}
        <Text style={styles.price}>
          {priceText}
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
