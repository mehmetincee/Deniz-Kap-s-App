import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Icon } from '../../../components/Icon';
import { MemberCard } from '../../../components/MemberCard';
import { useNow } from '../../../hooks/useNow';
import { CODE_WINDOW_MS, makeMemberCode, windowOf } from '../../../services/memberCode';
import { Button, Card, ListSection, Row, Screen, Segmented, T, tap } from '../../../components/ui';
import { rewards, tiers, topUpOptions } from '../../../config/restaurant';
import { formatPrice } from '../../../data/menu';
import { payWithCard } from '../../../services/payment';
import { useStore, useTier } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
}

/**
 * Kasada okutulan QR kodu her 30 saniyede yenilenir; ekran görüntüsüyle
 * başkasının İnci kazanmasını zorlaştırır. Gerçekte kod sunucuda imzalanmalı (TOTP).
 */
function useRotatingCode(memberNo: string, secret: string) {
  const now = useNow(5000);
  const win = windowOf(now);
  const [code, setCode] = useState(memberNo);
  useEffect(() => {
    let alive = true;
    makeMemberCode(memberNo, secret, win * CODE_WINDOW_MS).then((c) => alive && setCode(c));
    return () => {
      alive = false;
    };
  }, [memberNo, secret, win]);
  return code;
}

export default function LoyaltyCard() {
  const { user, pearls, wallet, activity, coupons, topUp, redeem } = useStore();
  const code = useRotatingCode(user?.memberNo ?? 'MISAFIR', user?.secret ?? '');
  const [amount, setAmount] = useState<number>(topUpOptions[1].amount);
  const [loading, setLoading] = useState(false);
  const { current } = useTier();
  const now = useNow();
  const activeCoupons = coupons.filter((c) => !c.used && new Date(c.expiresAt).getTime() > now);

  async function doTopUp() {
    const o = topUpOptions.find((x) => x.amount === amount)!;
    setLoading(true);
    // Yükleme de gerçek bir kart ödemesidir; ödeme onaylanmadan bakiye eklenmez.
    const res = await payWithCard(o.amount);
    setLoading(false);
    if (!res.ok) return notify('Yükleme yapılamadı', res.message);
    // [alerts] "Avoid using an alert merely to provide information" → başarı penceresi yok; bakiye ekranda güncellenir
    topUp(o.amount, o.bonus);
  }

  return (
    <Screen>
      <MemberCard />

      {/* QR her iki görünüm modunda da beyaz zemin üstünde siyah kalır: okuyucular ters renkli kodu okuyamayabilir.
          [layout › watchOS] QR gösterme anının özel bir kullanım olduğu HIG'de de belirtilir. */}
      <Card style={styles.qrCard}>
        <View style={styles.qrBox} accessible accessibilityLabel="Üyelik QR kodu">
          <QRCode value={code} size={180} color="#000000" backgroundColor="#FFFFFF" />
        </View>
        <T v="h3" style={{ marginTop: space.lg }}>
          Hesabı öderken okutun
        </T>
        <T v="small" style={{ textAlign: 'center', marginTop: 4 }}>
          Garsonunuza ya da kasaya gösterin; hesap tutarınız kadar İnci yüklenir. Kod 30 saniyede bir yenilenir.
        </T>
        <Text style={styles.memberNo} selectable>
          {user?.memberNo}
        </Text>
      </Card>

      <ListSection header="Deniz Kapısı Cüzdan" footer="Kullanılmayan bakiye, talep halinde yükleme yapılan karta iade edilir.">
        <View style={styles.walletRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Bakiye</Text>
            <Text style={styles.walletValue}>{formatPrice(wallet)}</Text>
          </View>
          <Text style={styles.walletBonus}>+{topUpOptions.find((o) => o.amount === amount)?.bonus} İnci bonus</Text>
        </View>
        <View style={{ padding: space.lg, gap: space.md }}>
          {/* [segmented-controls] birbiriyle ilişkili tek seçim → segment kontrolü */}
          <Segmented value={amount} onChange={setAmount} options={topUpOptions.map((o) => ({ value: o.amount as number, label: formatPrice(o.amount) }))} />
          <Button title={loading ? 'Ödeme bekleniyor…' : `${formatPrice(amount)} yükle`} icon="wallet" loading={loading} onPress={doTopUp} />
        </View>
      </ListSection>

      {activeCoupons.length > 0 && (
        <ListSection header="Kuponlarım" footer="Kodu garsonunuza gösterin.">
          {activeCoupons.map((c) => (
            <Row
              key={c.id}
              icon="gift"
              iconColor={colors.orange}
              title={c.title}
              subtitle={`Son gün ${new Date(c.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`}
              right={
                <Text style={styles.couponCode} selectable accessibilityLabel={`Kupon kodu ${c.code.split('').join(' ')}`}>
                  {c.code}
                </Text>
              }
            />
          ))}
        </ListSection>
      )}

      <ListSection header="İnci ile al" footer="Ödül alındığında 30 gün geçerli bir kupon kodu oluşur.">
        {rewards.map((r) => {
          const enough = pearls >= r.cost;
          return (
            <Row
              key={r.id}
              icon="gift"
              iconColor={colors.indigo}
              title={r.title}
              subtitle={r.note}
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, ${r.cost} İnci`}
                  accessibilityState={{ disabled: !enough }}
                  accessibilityHint={enough ? 'Kupon oluşturur' : `${r.cost - pearls} İnci daha gerekli`}
                  disabled={!enough}
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    // Kupon "Kuponlarım" bölümünde hemen görünür; ayrıca bilgi penceresi açılmaz [alerts]
                    redeem(r.title, r.cost);
                  }}
                  style={[styles.costButton, !enough && { opacity: 0.45 }]}
                >
                  <Text style={styles.costText}>{r.cost} İnci</Text>
                </Pressable>
              }
            />
          );
        })}
      </ListSection>

      <ListSection header="Seviyeler" footer="Seviye, son 12 aydaki harcamanıza göre belirlenir.">
        {tiers.map((t) => (
          <Row
            key={t.id}
            title={`${t.name} · ${t.min === 0 ? 'başlangıç' : `yıllık ${formatPrice(t.min)}+`}`}
            subtitle={t.perks.join(' · ')}
            right={t.id === current.id ? <Icon name="check" size={17} color={colors.accent} weight="semibold" /> : <View style={{ width: 17 }} />}
          />
        ))}
      </ListSection>

      <ListSection header="Hareketler">
        {activity.length === 0 && <Row title="Henüz hareket yok" />}
        {activity.slice(0, 12).map((a) => (
          <Row
            key={a.id}
            title={a.title}
            subtitle={new Date(a.at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            right={
              a.pearls !== undefined && a.pearls !== 0 ? (
                // [color › Inclusive color] artı/eksi işareti de yazılır, yalnızca renk değil
                <Text style={[styles.delta, { color: a.pearls > 0 ? colors.green : colors.red }]}>
                  {a.pearls > 0 ? '+' : '−'}
                  {Math.abs(a.pearls)} İnci
                </Text>
              ) : (
                <View />
              )
            }
          />
        ))}
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: { marginTop: space.md, alignItems: 'center', paddingVertical: space.xl },
  qrBox: { padding: space.md, borderRadius: radius.md, backgroundColor: '#FFFFFF' },
  memberNo: { ...font.mono, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: space.sm },
  walletRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.lg, paddingTop: space.lg },
  walletLabel: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel },
  walletValue: { ...font.serifBold, ...textStyle.title1, color: colors.label },
  walletBonus: { ...font.semibold, ...textStyle.footnote, color: colors.green, marginBottom: 6 },
  couponCode: { ...font.mono, ...textStyle.headline, color: colors.label },
  costButton: { backgroundColor: colors.fill, borderRadius: radius.pill, paddingHorizontal: 12, height: 30, justifyContent: 'center' },
  costText: { ...font.semibold, ...textStyle.footnote, color: colors.accent },
  delta: { ...font.semibold, ...textStyle.subhead },
});
