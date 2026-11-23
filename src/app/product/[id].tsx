import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../components/Icon';
import { Button, IconButton, ListSection, Material, Stepper, T, tap } from '../../components/ui';
import { ordering } from '../../config/restaurant';
import { allergenName, formatPrice, getProduct, localize, localizeOption, orderBlockReason } from '../../data/menu';
import { useT } from '../../i18n';
import { useStore } from '../../store';
import { colors, font, space, textStyle } from '../../theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const product = getProduct(id);
  const addToCart = useStore((s) => s.addToCart);
  const isFavorite = useStore((s) => s.favorites.includes(id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [optionId, setOptionId] = useState(product?.options?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  if (!product) {
    return (
      <View style={{ flex: 1, padding: space.xl, paddingTop: insets.top + space.xl }}>
        <T v="h2">{t('product.notFound')}</T>
        <Button title={t('product.back')} variant="secondary" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </View>
    );
  }

  const option = product.options?.find((o) => o.id === optionId);
  const blocked = orderBlockReason(product.id);
  const l = localize(product, lang);
  // Sipariş kapalıyken (QR menü modu) sayfa yalnızca bilgi gösterir; seçim, not ve "Ekle" yok
  const canOrder = ordering.enabled && !product.askWaiter;
  const unit = option?.price ?? product.price;

  // Sayfa (sheet) olarak açılır: aşağı kaydırarak kapanır [sheets].
  // Üst kontroller fotoğrafın üstünde yüzer → "clear" Liquid Glass [materials].
  // [sheets] "the Cancel button belongs on the leading edge" → Kapat solda; ikincil eylem (favori) sağda.
  const top = Platform.OS === 'ios' ? space.md : insets.top + space.md;
  return (
    <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {product.image ? (
          <Image source={product.image} style={styles.hero} contentFit="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Image source={require('../../../assets/images/mark.png')} style={{ width: 72, height: 72, opacity: 0.3 }} contentFit="contain" />
          </View>
        )}

        <View style={{ padding: space.lg }}>
          <T v="h1">{l.title}</T>
          {!!l.alt && <Text style={styles.en}>{l.alt}</Text>}
          {!!l.description && <T style={{ marginTop: space.md }}>{l.description}</T>}
          {!product.options && <Text style={styles.price}>{product.askWaiter ? t('menu.askWaiter') : formatPrice(product.price)}</Text>}
        </View>

        {/* [lists-and-tables] "a table that lists options… adding an image — such as a checkmark — indicating that the item is selected" */}
        {product.options && (
          <ListSection header={t(product.optionsTitle === 'Sos seçimi' ? 'product.sauce' : 'product.choice')} style={styles.section}>
            {product.options.map((o) => {
              const active = o.id === optionId;
              return (
                <Pressable
                  key={o.id}
                  accessibilityRole={canOrder ? 'radio' : 'text'}
                  accessibilityState={canOrder ? { checked: active } : undefined}
                  disabled={!canOrder}
                  onPress={() => (tap(), setOptionId(o.id))}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.fill }]}
                >
                  <Text style={styles.optionName}>{localizeOption(o.name, lang)}</Text>
                  <Text style={styles.optionPrice}>{formatPrice(o.price)}</Text>
                  <View style={{ width: 22, alignItems: 'flex-end' }}>{canOrder && active && <Icon name="check" size={17} color={colors.accent} weight="semibold" />}</View>
                </Pressable>
              );
            })}
          </ListSection>
        )}

        {canOrder && (
          <ListSection header="Mutfağa not" style={styles.section}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ör. az acılı, soğansız…"
              placeholderTextColor={colors.placeholder}
              style={styles.note}
              maxLength={120}
              accessibilityLabel="Mutfağa not"
            />
          </ListSection>
        )}

        {product.allergens.length > 0 && (
          // [color › Inclusive color] alerjenler adlarıyla yazılır, yalnızca simge/renkle değil
          <Text style={[styles.allergens]}>{t('product.contains', { list: product.allergens.map((a) => allergenName(a, lang)).join(', ') })}</Text>
        )}
      </ScrollView>

      <View style={[styles.topBar, { top }]} pointerEvents="box-none">
        <IconButton name="close" label={t('product.close')} overMedia={!!product.image} onPress={() => router.back()} />
        <IconButton
          name={isFavorite ? 'heart-filled' : 'heart'}
          color={isFavorite ? colors.red : colors.label}
          label={t(isFavorite ? 'product.favRemove' : 'product.favAdd')}
          overMedia={!!product.image}
          onPress={() => toggleFavorite(product.id)}
        />
      </View>

      {/* Alt eylem alanı kontrol katmanıdır: içerik altından kayar, sistem malzemesi üzerinde durur [materials], [layout] */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Material style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />
        {!canOrder ? (
          <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: space.sm }}>
            <Icon name="info" size={18} color={colors.accent} />
            <T v="secondary" style={{ textAlign: 'center' }}>
              {t('product.orderHint')}
            </T>
          </View>
        ) : product.askWaiter ? (
          <T v="secondary" style={{ flex: 1, textAlign: 'center' }}>
            Günün balığını garsonunuzla birlikte seçebilirsiniz.
          </T>
        ) : blocked ? (
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={18} color={colors.secondaryLabel} />
            <T v="secondary" style={{ textAlign: 'center' }}>
              {blocked}
            </T>
          </View>
        ) : (
          <>
            <Stepper value={qty} onChange={setQty} min={1} />
            {/* [buttons] görünümdeki tek belirgin (prominent) düğme */}
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
  hero: { width: '100%', height: 300 },
  heroPlaceholder: { backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  en: { ...font.serifItalic, ...textStyle.title3, color: colors.secondaryLabel, marginTop: 2 },
  price: { ...font.semibold, ...textStyle.headline, color: colors.label, marginTop: space.md },
  descEn: { ...font.serifItalic, ...textStyle.subhead, color: colors.secondaryLabel, marginTop: space.sm },
  section: { marginHorizontal: space.lg, marginTop: space.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingHorizontal: space.lg },
  optionName: { flex: 1, ...font.regular, ...textStyle.body, color: colors.label },
  optionPrice: { ...font.regular, ...textStyle.body, color: colors.secondaryLabel },
  note: { minHeight: 48, paddingHorizontal: space.lg, ...font.regular, ...textStyle.body, color: colors.label },
  allergens: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginHorizontal: space.lg * 2, marginTop: space.lg },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    overflow: 'hidden',
  },
});
