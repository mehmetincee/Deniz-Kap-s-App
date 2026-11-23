import { router, useLocalSearchParams } from 'expo-router';
import { useNow } from '../../hooks/useNow';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Button, Card, ListSection, Screen, T } from '../../components/ui';
import { formatPrice } from '../../data/menu';
import { ordering, restaurant } from '../../config/restaurant';
import { liveStatus, useStore, type OrderStatus } from '../../store';
import { colors, font, space, textStyle } from '../../theme';

const steps: { id: OrderStatus; title: string; sub: string }[] = [
  { id: 'alindi', title: 'Sipariş alındı', sub: 'Ekibimize ulaştı' },
  { id: 'hazirlaniyor', title: 'Hazırlanıyor', sub: 'Mutfağımız siparişinizle ilgileniyor' },
  { id: 'hazir', title: 'Hazır', sub: 'Size getiriliyor' },
  { id: 'teslim', title: 'Afiyet olsun', sub: 'Teslim edildi' },
];

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const reorder = useStore((s) => s.reorder);
  const now = useNow(3000);

  if (!order) {
    return (
      <Screen>
        <T v="h2">Sipariş bulunamadı</T>
        <Button title="Ana sayfa" variant="secondary" onPress={() => router.replace('/')} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const status = liveStatus(order, now);
  const current = steps.findIndex((s) => s.id === status);
  const reportIssue = () => {
    const text = `Merhaba, #${order.id.slice(-5)} numaralı siparişimle ilgili bir sorun var: `;
    Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
  };

  return (
    <Screen>
      {/* Yerel gezinme çubuğu standart Geri düğmesini sağlar [toolbars › "Use the standard Back and Close buttons"] */}
      <T v="label">Sipariş #{order.id.slice(-5)}</T>
      <T v="h1" style={{ marginTop: 2 }}>
        {order.mode === 'masa' ? `${ordering.areaName} ${order.table}` : `Gel-Al · ${order.pickupTime}`}
      </T>

      {/* [color › Inclusive color] tamamlanan adımlar onay simgesi + koyu metinle gösterilir, yalnızca renkle değil */}
      <Card style={{ marginTop: space.lg }}>
        {steps.map((s, i) => {
          const done = i <= current;
          return (
            <View key={s.id} style={styles.step}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.dot, done && styles.dotDone]}>{done && <Icon name="check" size={12} color={colors.onAccent} strokeWidth={2.4} weight="bold" />}</View>
                {i < steps.length - 1 && <View style={[styles.rail, i < current && styles.railDone]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Text style={[styles.stepTitle, !done && { color: colors.secondaryLabel }]}>{s.title}</Text>
                <T v="small">{s.sub}</T>
              </View>
            </View>
          );
        })}
      </Card>

      <ListSection
        header="Siparişiniz"
        footer={order.paid ? `+${order.pearlsEarned} İnci hesabınıza eklendi.` : 'Hesabı ödediğinizde İnci’leriniz kartınıza otomatik yüklenir.'}
      >
        {order.lines.map((l) => (
          <View key={l.key} style={styles.line}>
            <Text style={styles.lineText}>
              {l.qty} × {l.name}
              {l.optionName ? ` (${l.optionName})` : ''}
            </Text>
            <Text style={styles.linePrice}>{formatPrice(l.unitPrice * l.qty)}</Text>
          </View>
        ))}
        <View style={styles.line}>
          <Text style={styles.total}>{order.paid ? 'Ödenen' : 'Hesapta ödenecek'}</Text>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
        </View>
      </ListSection>

      <Button
        title="Tekrar sipariş ver"
        icon="repeat"
        onPress={() => {
          reorder(order);
          router.push('/cart');
        }}
        style={{ marginTop: space.xl }}
      />
      <Button title="Siparişimde sorun var" icon="help" variant="ghost" onPress={reportIssue} style={{ marginTop: space.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: space.md },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryGroupedBackground,
  },
  dotDone: { backgroundColor: colors.green, borderColor: colors.green },
  rail: { width: 2, flex: 1, backgroundColor: colors.separator, marginVertical: 2 },
  railDone: { backgroundColor: colors.green },
  stepTitle: { ...font.semibold, ...textStyle.headline, color: colors.label },
  line: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: space.lg, gap: space.md },
  lineText: { flex: 1, ...font.regular, ...textStyle.body, color: colors.label },
  linePrice: { ...font.regular, ...textStyle.body, color: colors.secondaryLabel },
  total: { ...font.semibold, ...textStyle.body, color: colors.label },
});
