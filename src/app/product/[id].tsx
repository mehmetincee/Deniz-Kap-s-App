import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../components/Icon';
import { Button, IconButton, Stepper, T, tap } from '../../components/ui';
import { allergenNames, formatPrice, getProduct } from '../../data/menu';
import { useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const product = getProduct(id);
  const addToCart = useStore((s) => s.addToCart);
  const [optionId, setOptionId] = useState(product?.options?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  if (!product) {
    return (
      <View style={{ flex: 1, padding: space.xl, paddingTop: insets.top + space.xl }}>
        <T v="h2">Ürün bulunamadı</T>
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </View>
    );
  }

  const option = product.options?.find((o) => o.id === optionId);
  const unit = option?.price ?? product.price;

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {product.image ? (
          <Image source={product.image} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Image source={require('../../../assets/images/mark.png')} style={{ width: 84, height: 84, opacity: 0.35 }} contentFit="contain" />
          </View>
        )}
        <IconButton name="close" label="Kapat" onPress={() => router.back()} style={[styles.close, { top: insets.top + space.md }]} />

        <View style={{ padding: space.xl }}>
          <T v="h1">{product.name}</T>
          {!!product.nameEn && !product.nameEn.includes(',') && <Text style={styles.en}>{product.nameEn}</Text>}
          {!!product.description && <T style={{ marginTop: space.md, fontSize: 15, lineHeight: 22 }}>{product.description}</T>}
          {!!product.descriptionEn && <Text style={styles.descEn}>{product.descriptionEn}</Text>}

          {product.allergens.length > 0 && (
            <View style={styles.allergens}>
              <Icon name="info" size={16} color={colors.muted} />
              <T v="small" style={{ flex: 1 }}>
                İçerir: {product.allergens.map((a) => allergenNames[a]).join(', ')}
              </T>
            </View>
          )}

          {product.options && (
            <View style={{ marginTop: space.xl }}>
              <T v="label">{product.optionsTitle}</T>
              {product.options.map((o) => {
                const active = o.id === optionId;
                return (
                  <Pressable key={o.id} onPress={() => (tap(), setOptionId(o.id))} style={styles.option}>
                    <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                    <Text style={styles.optionName}>{o.name}</Text>
                    <Text style={styles.optionPrice}>{formatPrice(o.price)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!product.askWaiter && (
            <View style={{ marginTop: space.xl }}>
              <T v="label">Mutfağa not</T>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ör. az acılı, soğansız…"
                placeholderTextColor={colors.muted}
                style={styles.note}
                maxLength={120}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        {product.askWaiter ? (
          <T style={{ flex: 1, textAlign: 'center' }}>Günün balığını garsonunuzla birlikte seçebilirsiniz.</T>
        ) : (
          <>
            <Stepper value={qty} onChange={setQty} min={1} />
            <Button
              title={`Ekle · ${formatPrice(unit * qty)}`}
              style={{ flex: 1 }}
              onPress={() => {
                addToCart(product, { optionId, qty, note: note.trim() || undefined });
                router.back();
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 320 },
  heroPlaceholder: { backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: space.lg },
  en: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.muted, marginTop: 2 },
  descEn: { fontFamily: fonts.displayItalic, fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: space.sm },
  allergens: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.sandDeep,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.seaDeep },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.seaDeep },
  optionName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink },
  optionPrice: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  note: {
    marginTop: space.sm,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    backgroundColor: colors.sand,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
