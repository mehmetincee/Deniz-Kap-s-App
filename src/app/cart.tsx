import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../components/Icon';
import { Button, Chip, Divider, IconButton, Stepper, T, tap } from '../components/ui';
import { formatPrice } from '../data/menu';
import { payWithCard } from '../services/payment';
import { cartTotal, tierFor, useStore, type PaymentMethod } from '../store';
import { colors, fonts, radius, space } from '../theme';

const tipOptions = [0, 0.05, 0.1, 0.15];

function pickupSlots(now = new Date()) {
  const slots: string[] = [];
  const t = new Date(now);
  t.setMinutes(Math.ceil((t.getMinutes() + 20) / 15) * 15, 0, 0);
  for (let i = 0; i < 6; i++) {
    slots.push(t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    t.setMinutes(t.getMinutes() + 15);
  }
  return slots;
}

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { cart, setQty, wallet, pearls, yearSpend, orderMode, table, setOrderContext, placeOrder } = useStore();
  const [slot, setSlot] = useState(pickupSlots()[0]);
  const [tip, setTip] = useState(0);
  const [usePearls, setUsePearls] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('kart');
  const [busy, setBusy] = useState(false);

  const subtotal = cartTotal(cart);
  const tipAmount = Math.round(subtotal * tip);
  const pearlsUsed = usePearls ? Math.min(pearls, subtotal) : 0;
  const total = subtotal + tipAmount - pearlsUsed;
  const rate = tierFor(yearSpend).current.rate;
  const willEarn = Math.floor((total - tipAmount) * rate);

  const canPay = cart.length > 0 && (orderMode === 'gelal' || table.trim().length > 0) && (method === 'kart' || wallet >= total);

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
    router.replace({ pathname: '/order/[id]', params: { id: order.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand }}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.md }]}>
        <T v="h1" style={{ flex: 1 }}>
          Sepet
        </T>
        <IconButton name="close" label="Kapat" onPress={() => router.back()} />
      </View>

      {cart.length === 0 ? (
        <View style={{ padding: space.xl }}>
          <T>Sepetiniz boş. Menüden bir lezzet seçerek başlayın.</T>
          <Button title="Menüye git" variant="secondary" onPress={() => router.replace('/menu')} style={{ marginTop: space.xl }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: 160 }}>
          <View style={styles.segment}>
            <Segment icon="table" label="Masaya" active={orderMode === 'masa'} onPress={() => setOrderContext({ orderMode: 'masa' })} />
            <Segment icon="bag" label="Gel-Al" active={orderMode === 'gelal'} onPress={() => setOrderContext({ orderMode: 'gelal' })} />
          </View>

          {orderMode === 'masa' ? (
            <View style={{ marginTop: space.lg }}>
              <T v="label">Masa / şezlong numarası</T>
              <TextInput
                value={table}
                onChangeText={(v) => setOrderContext({ table: v.slice(0, 8) })}
                placeholder="Masadaki QR'daki numara, ör. T12 veya Ş4"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>
          ) : (
            <View style={{ marginTop: space.lg }}>
              <T v="label">Teslim saati</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, marginTop: space.sm }}>
                {pickupSlots().map((s) => (
                  <Chip key={s} label={s} active={s === slot} onPress={() => setSlot(s)} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ marginTop: space.xl }}>
            {cart.map((l) => (
              <View key={l.key} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{l.name}</Text>
                  {(l.optionName || l.note) && <T v="small">{[l.optionName, l.note].filter(Boolean).join(' · ')}</T>}
                  <Text style={styles.linePrice}>{formatPrice(l.unitPrice * l.qty)}</Text>
                </View>
                <Stepper small value={l.qty} onChange={(n) => setQty(l.key, n)} />
              </View>
            ))}
          </View>

          <View style={{ marginTop: space.xl }}>
            <T v="label">Servis ekibine bahşiş</T>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              {tipOptions.map((t) => (
                <Chip key={t} label={t === 0 ? 'Yok' : `%${t * 100}`} active={tip === t} onPress={() => setTip(t)} style={{ flex: 1, alignItems: 'center' }} />
              ))}
            </View>
          </View>

          <View style={styles.pearlRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineName}>İnci kullan</Text>
              <T v="small">{pearls.toLocaleString('tr-TR')} İnci = {formatPrice(pearls)}</T>
            </View>
            <Switch
              value={usePearls}
              onValueChange={(v) => (tap(), setUsePearls(v))}
              disabled={pearls === 0}
              trackColor={{ true: colors.sea, false: colors.line }}
              thumbColor={colors.white}
            />
          </View>

          <View style={{ marginTop: space.xl }}>
            <T v="label">Ödeme yöntemi</T>
            <PayOption icon="card" title="Kredi / banka kartı" sub="3D Secure ile güvenli ödeme" active={method === 'kart'} onPress={() => setMethod('kart')} />
            <PayOption
              icon="wallet"
              title="Deniz Kapısı Cüzdan"
              sub={wallet >= total ? `Bakiye ${formatPrice(wallet)}` : `Bakiye yetersiz (${formatPrice(wallet)})`}
              active={method === 'cuzdan'}
              onPress={() => setMethod('cuzdan')}
            />
          </View>

          <View style={styles.summary}>
            <SumRow label="Ara toplam" value={formatPrice(subtotal)} />
            {tipAmount > 0 && <SumRow label="Bahşiş" value={formatPrice(tipAmount)} />}
            {pearlsUsed > 0 && <SumRow label="İnci indirimi" value={`−${formatPrice(pearlsUsed)}`} />}
            <Divider style={{ marginVertical: space.sm }} />
            <SumRow label="Toplam" value={formatPrice(total)} bold />
            <T v="small" style={{ marginTop: space.sm, color: colors.sea }}>
              Bu siparişten {willEarn} İnci kazanacaksınız.
            </T>
          </View>
        </ScrollView>
      )}

      {cart.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          <Button title={`Öde · ${formatPrice(total)}`} onPress={pay} loading={busy} disabled={!canPay} />
          {orderMode === 'masa' && !table.trim() && (
            <T v="small" style={{ textAlign: 'center', marginTop: space.sm }}>
              Devam etmek için masa numarasını girin.
            </T>
          )}
        </View>
      )}
    </View>
  );
}

function Segment({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => (tap(), onPress())} style={[styles.segmentItem, active && styles.segmentActive]}>
      <Icon name={icon} size={18} color={active ? colors.white : colors.ink} />
      <Text style={[styles.segmentText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

function PayOption({ icon, title, sub, active, onPress }: { icon: IconName; title: string; sub: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => (tap(), onPress())} style={[styles.pay, active && { borderColor: colors.seaDeep }]}>
      <Icon name={icon} size={20} color={colors.sea} />
      <View style={{ flex: 1 }}>
        <Text style={styles.lineName}>{title}</Text>
        <T v="small">{sub}</T>
      </View>
      <View style={[styles.radio, active && { borderColor: colors.seaDeep }]}>{active && <View style={styles.radioDot} />}</View>
    </Pressable>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <T style={bold && { fontFamily: fonts.bodySemi, color: colors.ink, fontSize: 16 }}>{label}</T>
      <T style={[{ color: colors.ink }, bold && { fontFamily: fonts.bodySemi, fontSize: 16 }]}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xl, paddingBottom: space.sm },
  segment: { flexDirection: 'row', backgroundColor: colors.sandDeep, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, height: 44, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segmentActive: { backgroundColor: colors.seaDeep },
  segmentText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  input: {
    marginTop: space.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  lineName: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  linePrice: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  pearlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.foam,
  },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.seaDeep },
  summary: { marginTop: space.xl, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.surface },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    backgroundColor: colors.sand,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
