import { router, useLocalSearchParams } from 'expo-router';
import { useNow } from '../../hooks/useNow';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Button, Card, Divider, IconButton, Screen, T } from '../../components/ui';
import { formatPrice } from '../../data/menu';
import { ordering, restaurant } from '../../config/restaurant';
import { liveStatus, useStore, type OrderStatus } from '../../store';
import { colors, fonts, space } from '../../theme';

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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T v="label">Sipariş #{order.id.slice(-5)}</T>
          <T v="h1" style={{ marginTop: 4 }}>
            {order.mode === 'masa' ? `${ordering.areaName} ${order.table}` : `Gel-Al · ${order.pickupTime}`}
          </T>
        </View>
        <IconButton name="close" label="Kapat" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <Card style={{ marginTop: space.xl }}>
        {steps.map((s, i) => {
          const done = i <= current;
          return (
            <View key={s.id} style={styles.step}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.dot, done && styles.dotDone]}>{done && <Icon name="check" size={14} color={colors.white} strokeWidth={2.4} />}</View>
                {i < steps.length - 1 && <View style={[styles.rail, i < current && { backgroundColor: colors.seaDeep }]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Text style={[styles.stepTitle, !done && { color: colors.muted }]}>{s.title}</Text>
                <T v="small">{s.sub}</T>
              </View>
            </View>
          );
        })}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        {order.lines.map((l) => (
          <View key={l.key} style={styles.line}>
            <T style={{ flex: 1, color: colors.ink }}>
              {l.qty} × {l.name}
              {l.optionName ? ` (${l.optionName})` : ''}
            </T>
            <T style={{ color: colors.ink }}>{formatPrice(l.unitPrice * l.qty)}</T>
          </View>
        ))}
        <Divider style={{ marginVertical: space.sm }} />
        <View style={styles.line}>
          <Text style={styles.total}>{order.paid ? 'Ödenen' : 'Hesapta ödenecek'}</Text>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
        </View>
        <T v="small" style={{ color: colors.sea, marginTop: 4 }}>
          {order.paid
            ? `+${order.pearlsEarned} İnci hesabınıza eklendi`
            : 'Hesabı ödediğinizde İnci’leriniz kartınıza otomatik yüklenir.'}
        </T>
      </Card>

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
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dotDone: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  rail: { width: 2, flex: 1, backgroundColor: colors.line, marginVertical: 2 },
  stepTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  line: { flexDirection: 'row', paddingVertical: 4, gap: space.md },
  total: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
});
