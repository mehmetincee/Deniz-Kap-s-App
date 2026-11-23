import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../components/Icon';
import { Button, Chip, IconButton, ListSection, Material, Row, Segmented, Stepper, T, tap } from '../components/ui';
import { ordering, restaurant, serviceHours } from '../config/restaurant';
import { formatPrice, orderBlockReason } from '../data/menu';
import { payWithCard } from '../services/payment';
import { cartTotal, useStore, useTier, type PaymentMethod } from '../store';
import { colors, font, space, textStyle } from '../theme';

const tipOptions = [0, 0.05, 0.1, 0.15];

/** En erken 20 dk sonrası, 15 dk aralıklarla; mutfak kapanış saatini geçmez. */
function pickupSlots(now = new Date()) {
  const slots: string[] = [];
  const [ch, cm] = serviceHours.kitchen.to.split(':').map(Number);
  const close = new Date(now);
  close.setHours(ch, cm, 0, 0);
  const t = new Date(now);
  t.setMinutes(Math.ceil((t.getMinutes() + 20) / 15) * 15, 0, 0);
  while (slots.length < 6 && t <= close) {
    slots.push(t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    t.setMinutes(t.getMinutes() + 15);
  }
  return slots;
}

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { cart, setQty, wallet, pearls, orderMode: storedMode, table, setOrderContext, placeOrder } = useStore();
  const online = ordering.onlinePayment;
  // Gel-Al kapalıyken (plaj pilotu) her sipariş şezlonga gider
  const orderMode = ordering.pickup ? storedMode : 'masa';
  const area = ordering.areaName;
  const slots = pickupSlots();
  const [slotPick, setSlot] = useState<string | undefined>(slots[0]);
  // Ekran açıkken saat ilerlerse seçilen saat listeden düşebilir
  const slot = slotPick && slots.includes(slotPick) ? slotPick : slots[0];
  const [tipPick, setTip] = useState(0);
  const [usePearlsPick, setUsePearls] = useState(false);
  const [methodPick, setMethod] = useState<PaymentMethod>('kart');
  // Uygulama içi ödeme kapalıyken bahşiş ve İnci harcama da ödemeyle birlikte masada yapılır
  const tip = online ? tipPick : 0;
  const usePearls = online && usePearlsPick;
  const method: PaymentMethod = online ? methodPick : 'hesap';
  const [busy, setBusy] = useState(false);

  const subtotal = cartTotal(cart);
  const tipAmount = Math.round(subtotal * tip);
  const pearlsUsed = usePearls ? Math.min(pearls, subtotal) : 0;
  const total = subtotal + tipAmount - pearlsUsed;
  const rate = useTier().current.rate;
  const willEarn = Math.floor((total - tipAmount) * rate);

  const blocked = cart.map((l) => ({ line: l, reason: orderBlockReason(l.productId) })).filter((b) => b.reason);
  const canPay =
    cart.length > 0 &&
    blocked.length === 0 &&
    (orderMode === 'gelal' ? !!slot : table.trim().length > 0) &&
    (method !== 'cuzdan' || wallet >= total);

  async function pay() {
    setBusy(true);
    if (method === 'kart' && total > 0) {
      const res = await payWithCard(total);
      if (!res.ok) {
        setBusy(false);
        const msg = `Ödeme alınamadı: ${res.message}`;
        return Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Ödeme', msg);
      }
    }
    const order = placeOrder({
      mode: orderMode,
      table: orderMode === 'masa' ? table.trim() : undefined,
      pickupTime: orderMode === 'gelal' ? slot : undefined,
      subtotal,
      tip: tipAmount,
      pearlsUsed,
      total,
      payment: method,
    });
    setBusy(false);
    if (ordering.channel === 'whatsapp') {
      // Sunucu kurulana kadar: sipariş, barın WhatsApp hattına hazır metin olarak gider
      const lines = order.lines.map(
        (l) => `${l.qty} × ${l.name}${l.optionName ? ` (${l.optionName})` : ''}${l.note ? ` – ${l.note}` : ''}`,
      );
      const text = [
        `${area} ${order.table} · Sipariş #${order.id.slice(-5)}`,
        ...lines,
        `Toplam: ${formatPrice(order.total)} (hesapta ödenecek)`,
        `Üye: ${order.memberNo ?? '-'}`,
      ].join('\n');
      Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
    }
    router.replace({ pathname: '/order/[id]', params: { id: order.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
      {/* [sheets] tek görünümlü sayfada kapatma solda; [toolbars] standart Kapat simgesi, metin yok; başlık < 15 karakter */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.md : insets.top + space.sm }]}>
        <IconButton name="close" label="Kapat" onPress={() => router.back()} />
        <Text style={styles.headerTitle} accessibilityRole="header">
          Sepet
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {cart.length === 0 ? (
        <View style={{ padding: space.xl, alignItems: 'center' }}>
          <T v="secondary" style={{ textAlign: 'center' }}>
            Sepetiniz boş. Menüden bir lezzet seçerek başlayın.
          </T>
          <Button title="Menüye git" variant="secondary" onPress={() => router.replace('/menu')} style={{ marginTop: space.xl }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 170 }} keyboardShouldPersistTaps="handled">
          {ordering.pickup && (
            <Segmented
              style={{ marginTop: space.md }}
              value={orderMode}
              onChange={(v) => setOrderContext({ orderMode: v })}
              options={[
                { value: 'masa', label: 'Masaya', icon: 'table' },
                { value: 'gelal', label: 'Gel-Al', icon: 'bag' },
              ]}
            />
          )}

          {orderMode === 'masa' ? (
            <ListSection header={`${area} numarası`} footer={`${area}unuzdaki QR okutulduysa numara kendiliğinden gelir.`}>
              <TextInput
                value={table}
                onChangeText={(v) => setOrderContext({ table: v.toLocaleUpperCase('tr-TR').slice(0, 8) })}
                placeholder={`${area}taki QR'da yazan numara, ör. Ş12`}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                autoCapitalize="characters"
                accessibilityLabel={`${area} numarası`}
              />
            </ListSection>
          ) : (
            <View style={{ marginTop: space.xl }}>
              <Text style={styles.sectionHeader}>Teslim saati</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 5 }}>
                {slots.map((x) => (
                  <Chip key={x} label={x} active={x === slot} onPress={() => setSlot(x)} />
                ))}
                {slots.length === 0 && <T v="secondary">Bugün için uygun teslim saati kalmadı.</T>}
              </ScrollView>
            </View>
          )}

          {/* [lists-and-tables] sipariş satırları gruplanmış liste */}
          <ListSection header="Siparişiniz">
            {cart.map((l) => {
              const reason = orderBlockReason(l.productId);
              return (
                <View key={l.key} style={styles.line}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineName}>{l.name}</Text>
                    {(l.optionName || l.note) && <Text style={styles.lineMeta}>{[l.optionName, l.note].filter(Boolean).join(' · ')}</Text>}
                    <Text style={styles.linePrice}>{formatPrice(l.unitPrice * l.qty)}</Text>
                    {!!reason && <Text style={styles.lineWarn}>{reason}</Text>}
                  </View>
                  <Stepper small value={l.qty} onChange={(n) => setQty(l.key, n)} />
                </View>
              );
            })}
          </ListSection>

          {online && (
            <>
              <View style={{ marginTop: space.xl }}>
                <Text style={styles.sectionHeader}>Servis ekibine bahşiş</Text>
                <Segmented value={tip} onChange={setTip} options={tipOptions.map((t) => ({ value: t, label: t === 0 ? 'Yok' : `%${t * 100}` }))} />
              </View>

              <ListSection footer={`${pearls.toLocaleString('tr-TR')} İnci = ${formatPrice(pearls)}`}>
                <Row
                  icon="gift"
                  iconColor={colors.indigo}
                  title="İnci kullan"
                  right={
                    // [toggles] "The default green color tends to work well in most cases"
                    <Switch value={usePearls} onValueChange={(v) => (tap(), setUsePearls(v))} disabled={pearls === 0} trackColor={{ true: colors.green }} />
                  }
                />
              </ListSection>

              {/* [lists-and-tables] seçenek listesi: seçili satırda onay işareti */}
              <ListSection header="Ödeme yöntemi">
                <Row
                  icon="wallet"
                  iconColor={colors.accent}
                  title="Kredi / banka kartı"
                  subtitle="3D Secure ile güvenli ödeme"
                  onPress={() => setMethod('kart')}
                  right={method === 'kart' ? <Icon name="check" size={17} color={colors.accent} weight="semibold" /> : <View />}
                />
                <Row
                  icon="card"
                  iconColor={colors.indigo}
                  title="Deniz Kapısı Cüzdan"
                  subtitle={wallet >= total ? `Bakiye ${formatPrice(wallet)}` : `Bakiye yetersiz (${formatPrice(wallet)})`}
                  onPress={() => setMethod('cuzdan')}
                  right={method === 'cuzdan' ? <Icon name="check" size={17} color={colors.accent} weight="semibold" /> : <View />}
                />
              </ListSection>
            </>
          )}

          {!online && (
            <ListSection>
              <Row icon="receipt" iconColor={colors.teal} title="Ödeme hesapta" subtitle="Ayrılırken garsonumuza ya da kasaya ödersiniz." />
            </ListSection>
          )}

          <ListSection
            footer={
              online
                ? `Bu siparişten ${willEarn} İnci kazanacaksınız.`
                : `Ödeme alındığında yaklaşık ${willEarn} İnci kartınıza otomatik yüklenir.`
            }
          >
            <SumRow label="Ara toplam" value={formatPrice(subtotal)} />
            {tipAmount > 0 && <SumRow label="Bahşiş" value={formatPrice(tipAmount)} />}
            {pearlsUsed > 0 && <SumRow label="İnci indirimi" value={`−${formatPrice(pearlsUsed)}`} />}
            <SumRow label="Toplam" value={formatPrice(total)} bold />
          </ListSection>
        </ScrollView>
      )}

      {cart.length > 0 && (
        // Alt eylem alanı: kontrol katmanı [materials], tek belirgin düğme [buttons]
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <Material style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />
          <Button
            title={online ? `Öde · ${formatPrice(total)}` : `Siparişi gönder · ${formatPrice(total)}`}
            onPress={pay}
            loading={busy}
            disabled={!canPay}
          />
          {blocked.length > 0 ? (
            <Text style={[styles.hint, { color: colors.red }]}>Şu an hazırlanamayan ürünleri sepetten çıkarın.</Text>
          ) : (
            orderMode === 'masa' && !table.trim() && <Text style={styles.hint}>Devam etmek için {area.toLocaleLowerCase('tr-TR')} numarasını girin.</Text>
          )}
        </View>
      )}
    </View>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, bold && { ...font.semibold }]}>{label}</Text>
      <Text style={[styles.sumValue, bold && { ...font.semibold, color: colors.label }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.sm },
  headerTitle: { flex: 1, textAlign: 'center', ...font.semibold, ...textStyle.headline, color: colors.label },
  sectionHeader: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginHorizontal: space.lg, marginBottom: 7 },
  input: { minHeight: 48, paddingHorizontal: space.lg, ...font.regular, ...textStyle.body, color: colors.label },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  lineName: { ...font.regular, ...textStyle.body, color: colors.label },
  lineMeta: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: 1 },
  linePrice: { ...font.regular, ...textStyle.subhead, color: colors.secondaryLabel, marginTop: 2 },
  lineWarn: { ...font.regular, ...textStyle.footnote, color: colors.red, marginTop: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, paddingHorizontal: space.lg },
  sumLabel: { ...font.regular, ...textStyle.body, color: colors.label },
  sumValue: { ...font.regular, ...textStyle.body, color: colors.secondaryLabel },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, overflow: 'hidden' },
  hint: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, textAlign: 'center', marginTop: space.sm },
});
