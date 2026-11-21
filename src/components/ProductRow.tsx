import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice, type Product } from '../data/menu';
import { colors, fonts, radius, space } from '../theme';
import { Icon } from './Icon';
import { tap } from './ui';

export function ProductRow({ product }: { product: Product }) {
  const open = () => {
    tap();
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };
  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
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
          <View style={[styles.add, styles.addOnImage]}>
            <Icon name="plus" size={16} color={colors.white} strokeWidth={2} />
          </View>
        </View>
      ) : (
        <View style={styles.add}>
          <Icon name="plus" size={16} color={colors.white} strokeWidth={2} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  name: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  en: { fontFamily: fonts.displayItalic, fontSize: 14, color: colors.muted, marginTop: 1 },
  desc: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.inkSoft, marginTop: 6 },
  price: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, marginTop: 8 },
  image: { width: 92, height: 92, borderRadius: radius.md },
  add: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.seaDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnImage: { position: 'absolute', right: -6, bottom: -6, borderWidth: 3, borderColor: colors.sand, width: 36, height: 36, borderRadius: 18 },
});
