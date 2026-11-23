import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ColorValue } from 'react-native';

import { Icon } from '../components/Icon';
import { Button, Card, Segmented, T } from '../components/ui';
import { ordering, staffPin } from '../config/restaurant';
import { formatPrice } from '../data/menu';
import { useNow } from '../hooks/useNow';
import { parseMemberCode, verifyMemberCode } from '../services/memberCode';
import { liveStatus, useStore, type Order, type OrderStatus } from '../store';
import { colors, font, radius, space } from '../theme';

/**
 * PERSONEL PANELİ — bar/garson tableti için.
 *  1) Siparişler: şezlonglardan gelen siparişleri hazırla → teslim et → ödendi.
 *     "Ödendi" denince misafirin İnci'si otomatik yüklenir.
 *  2) Puan yükle: misafirin Kartım'daki QR'ı okut, hesap tutarını gir → İnci yüklenir.
 *
 * DEMO: Siparişler ve puanlar bu cihazda tutulur. Misafir telefonu ile bu tablet arasında
 * canlı bağlantı için sunucu (Supabase) gerekir — bkz. docs/PLAJ_PILOTU.md.
 */
export default function StaffPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [tab, setTab] = useState<'siparis' | 'puan'>('siparis');

  if (!unlocked) {
    return (
      <View style={[styles.root, { paddingTop: space.md }]}>
        <T v="secondary">Panel yalnızca restoran ekibi içindir.</T>
        <TextInput
          value={pin}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '').slice(0, 4);
            setPin(clean);
            if (clean === staffPin) setUnlocked(true);
          }}
          placeholder="PIN"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          secureTextEntry
          style={[styles.input, styles.pin]}
          autoFocus
        />
        {pin.length === 4 && pin !== staffPin && <Text style={styles.error}>PIN hatalı.</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: space.md }]}>
      {/* [segmented-controls › iOS] "switch between closely related subviews" */}
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'siparis', label: `${ordering.areaName} siparişleri` },
          { value: 'puan', label: 'Puan yükle' },
        ]}
      />
      {tab === 'siparis' ? <OrdersBoard /> : <PointsDesk />}
    </View>
  );
}

/* ---------------------------- Siparişler ---------------------------- */

const statusMeta: Record<OrderStatus, { label: string; next?: OrderStatus; action?: string; color: ColorValue }> = {
  alindi: { label: 'Yeni', next: 'hazirlaniyor', action: 'Hazırlamaya başla', color: colors.red },
  hazirlaniyor: { label: 'Hazırlanıyor', next: 'hazir', action: 'Hazır', color: colors.orange },
  hazir: { label: 'Hazır', next: 'teslim', action: 'Teslim edildi', color: colors.teal },
  teslim: { label: 'Teslim edildi', color: colors.green },
};

function OrdersBoard() {
  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const markPaid = useStore((s) => s.markPaid);
  const now = useNow(15000);
  const [showClosed, setShowClosed] = useState(false);

  // Açık: teslim edilmemiş ya da ödemesi alınmamış siparişler. En eski en üstte (önce o hazırlanır).
  const open = orders
    .filter((o) => o.mode === 'masa' && (liveStatus(o, now) !== 'teslim' || !o.paid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const closedToday = orders.filter((o) => o.paid && o.paidAt && new Date(o.paidAt).toDateString() === new Date(now).toDateString());
  const turnover = closedToday.reduce((s, o) => s + o.subtotal, 0);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={styles.stats}>
        <Stat label="Açık sipariş" value={String(open.length)} />
        <Stat label="Bugün kapanan" value={String(closedToday.length)} />
        <Stat label="Bugünkü ciro" value={formatPrice(turnover)} />
      </View>

      {open.length === 0 && (
        <Card style={{ marginTop: space.lg }}>
          <T v="h3">Bekleyen sipariş yok</T>
          <T style={{ marginTop: 4 }}>Yeni sipariş geldiğinde burada en üstte görünür.</T>
        </Card>
      )}

      {open.map((o) => (
        <OrderCard key={o.id} order={o} now={now} onStatus={(st) => setOrderStatus(o.id, st)} onPaid={() => markPaid(o.id)} />
      ))}

      {closedToday.length > 0 && (
        <Pressable onPress={() => setShowClosed((v) => !v)} style={{ marginTop: space.xl }}>
          <T v="label">
            Bugün kapananlar ({closedToday.length}) {showClosed ? '▲' : '▼'}
          </T>
        </Pressable>
      )}
      {showClosed &&
        closedToday.map((o) => (
          <View key={o.id} style={styles.closedRow}>
            <Text style={styles.closedSpot}>
              {ordering.areaName} {o.table}
            </Text>
            <T style={{ flex: 1 }}>
              #{o.id.slice(-5)} · {o.customerName ?? 'Misafir'}
            </T>
            <T style={{ color: colors.label }}>{formatPrice(o.subtotal)}</T>
          </View>
        ))}
    </ScrollView>
  );
}

function OrderCard({ order, now, onStatus, onPaid }: { order: Order; now: number; onStatus: (s: OrderStatus) => void; onPaid: () => void }) {
  const status = liveStatus(order, now);
  const meta = statusMeta[status];
  const mins = Math.max(0, Math.round((now - new Date(order.createdAt).getTime()) / 60000));
  const [confirmPay, setConfirmPay] = useState(false);

  return (
    <Card style={[styles.orderCard, { borderLeftColor: meta.color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text style={styles.spot}>{order.table}</Text>
        <View style={{ flex: 1 }}>
          <T v="h3">{order.customerName ?? 'Misafir'}</T>
          <T v="small">
            #{order.id.slice(-5)} · {mins === 0 ? 'şimdi' : `${mins} dk önce`} · {order.memberNo ?? 'üye değil'}
          </T>
        </View>
        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeText}>{meta.label}</Text>
        </View>
      </View>

      <View style={{ marginTop: space.md, gap: 4 }}>
        {order.lines.map((l) => (
          <View key={l.key} style={{ flexDirection: 'row', gap: space.sm }}>
            <Text style={styles.qty}>{l.qty}×</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>
                {l.name}
                {l.optionName ? ` · ${l.optionName}` : ''}
              </Text>
              {!!l.note && <Text style={styles.note}>Not: {l.note}</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardTotal}>
          {formatPrice(order.subtotal)} {order.paid ? '· ödendi' : '· hesapta'}
        </Text>
        {meta.next && <Button title={meta.action!} onPress={() => onStatus(meta.next!)} style={styles.smallBtn} />}
      </View>

      {!order.paid &&
        (confirmPay ? (
          <View style={styles.confirm}>
            <T style={{ flex: 1, color: colors.label }}>{formatPrice(order.subtotal)} tahsil edildi mi? İnci misafire yüklenecek.</T>
            <Button title="Vazgeç" variant="ghost" onPress={() => setConfirmPay(false)} style={styles.smallBtn} />
            <Button title="Evet" onPress={onPaid} style={styles.smallBtn} />
          </View>
        ) : (
          <Button title="Ödeme alındı" icon="check" variant="secondary" onPress={() => setConfirmPay(true)} style={{ marginTop: space.md, height: 46 }} />
        ))}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <T v="small">{label}</T>
    </View>
  );
}

/* ---------------------------- Puan yükle ---------------------------- */

function PointsDesk() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const user = useStore((s) => s.user);
  const creditPearls = useStore((s) => s.creditPearls);
  const staffLog = useStore((s) => s.staffLog);

  const parsed = useMemo(() => parseMemberCode(codeText), [codeText]);
  const amountNum = Number(amount.replace(',', '.'));

  async function submit() {
    if (!parsed) return;
    setBusy(true);
    setResult(null);
    let source: 'qr' | 'elle' = 'elle';
    if (!('manual' in parsed)) {
      source = 'qr';
      // DEMO: imzayı bu cihazdaki üyenin anahtarıyla doğrula. Sunucu modunda doğrulamayı sunucu yapar.
      if (!user || user.memberNo !== parsed.memberNo) {
        setBusy(false);
        return setResult({ ok: false, text: 'Bu karta yükleme için sunucu bağlantısı gerekli (demo: yalnızca bu cihazdaki üye).' });
      }
      const v = await verifyMemberCode(parsed, user.secret);
      if (!v.ok) {
        setBusy(false);
        return setResult({ ok: false, text: v.reason });
      }
    }
    const r = creditPearls(parsed.memberNo, amountNum, source);
    setBusy(false);
    if (!r.ok) return setResult({ ok: false, text: r.reason });
    setResult({ ok: true, text: `${parsed.memberNo} kartına ${r.pearls} İnci yüklendi (${formatPrice(amountNum)}).` });
    setCodeText('');
    setAmount('');
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <T style={{ marginTop: space.lg }}>
        Misafir hesabı öderken <Text style={{ ...font.semibold }}>Kartım</Text> ekranındaki QR&apos;ı gösterir. Okutun, ödenen
        tutarı girin; İnci seviyesine göre (%3–%7) otomatik hesaplanır.
      </T>

      {scanning && permission?.granted ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (parseMemberCode(data)) {
                setCodeText(data);
                setScanning(false);
              }
            }}
          />
          <Button title="Kapat" variant="light" onPress={() => setScanning(false)} style={styles.cameraClose} />
        </View>
      ) : (
        <Button
          title="Kartı kamerayla okut"
          icon="card"
          onPress={async () => {
            const p = permission?.granted ? permission : await requestPermission();
            if (p.granted) setScanning(true);
            else setResult({ ok: false, text: 'Kamera izni verilmedi. Üye numarasını elle yazabilirsiniz.' });
          }}
          style={{ marginTop: space.lg }}
        />
      )}

      <T v="label" style={{ marginTop: space.xl }}>
        Kart kodu veya üye no
      </T>
      <TextInput
        value={codeText}
        onChangeText={setCodeText}
        placeholder="Okutulan kod ya da DK12345678"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="characters"
        style={styles.input}
      />
      {!!codeText && (
        <T v="small" style={{ marginTop: 6, color: parsed ? colors.green : colors.red }}>
          {!parsed ? 'Kod tanınmadı.' : 'manual' in parsed ? `Üye ${parsed.memberNo} (elle girildi, kayda geçer)` : `Üye ${parsed.memberNo} · QR okundu`}
        </T>
      )}

      <T v="label" style={{ marginTop: space.lg }}>
        Ödenen hesap tutarı (₺)
      </T>
      <TextInput value={amount} onChangeText={setAmount} placeholder="Ör. 1450" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" style={styles.input} />

      <Button title="İnci yükle" onPress={submit} loading={busy} disabled={!parsed || !(amountNum > 0)} style={{ marginTop: space.xl }} />

      {result && (
        <View style={[styles.result, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <Icon name={result.ok ? 'check' : 'info'} size={18} color={result.ok ? colors.green : colors.red} />
          <T style={{ flex: 1, color: colors.label }}>{result.text}</T>
        </View>
      )}

      {staffLog.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <T v="label">Son işlemler</T>
          {staffLog.slice(0, 10).map((l) => (
            <View key={l.id} style={styles.closedRow}>
              <T style={{ flex: 1, color: colors.label }}>
                {l.memberNo} · {l.source === 'qr' ? 'QR' : l.source === 'siparis' ? 'Sipariş' : 'Elle'}
              </T>
              <T>
                {formatPrice(l.amount)} → +{l.pearls} İnci
              </T>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.groupedBackground, paddingHorizontal: space.xl },
  input: {
    marginTop: space.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.secondaryGroupedBackground,
    paddingHorizontal: space.lg,
    ...font.medium,
    fontSize: 15,
    color: colors.label,
  },
  pin: { textAlign: 'center', fontSize: 22, letterSpacing: 12, marginTop: space.xl },
  error: { ...font.medium, color: colors.red, marginTop: space.md },
  segment: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: radius.pill, padding: 4, marginTop: space.lg },
  segItem: { flex: 1, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.accent },
  segText: { ...font.semibold, fontSize: 13, color: colors.label },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  stat: { flex: 1, backgroundColor: colors.secondaryGroupedBackground, borderRadius: radius.md, padding: space.md },
  statValue: { ...font.serif, fontSize: 22, color: colors.label },
  orderCard: { marginTop: space.lg, borderLeftWidth: 5 },
  spot: {
    ...font.serifBold,
    fontSize: 28,
    color: colors.accent,
    minWidth: 56,
    textAlign: 'center',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  badgeText: { ...font.semibold, fontSize: 12, color: colors.onAccent },
  qty: { ...font.bold, fontSize: 15, color: colors.label, minWidth: 28 },
  item: { ...font.medium, fontSize: 15, color: colors.label },
  note: { ...font.semibold, fontSize: 13, color: colors.red, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, gap: space.md },
  cardTotal: { ...font.semibold, fontSize: 15, color: colors.secondaryLabel },
  smallBtn: { height: 42, paddingHorizontal: space.lg },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.fill },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  closedSpot: { ...font.semibold, fontSize: 13, color: colors.accent },
  cameraBox: { marginTop: space.lg, height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  cameraClose: { position: 'absolute', bottom: space.md, alignSelf: 'center', height: 44 },
  result: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.lg, padding: space.md, borderRadius: radius.md },
});
