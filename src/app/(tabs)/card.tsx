import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Icon } from '../../components/Icon';
import { MemberCard } from '../../components/MemberCard';
import { useNow } from '../../hooks/useNow';
import { CODE_WINDOW_MS, makeMemberCode, windowOf } from '../../services/memberCode';
import { Card, Chip, SectionTitle, Screen, T, tap } from '../../components/ui';
import { rewards, tiers, topUpOptions } from '../../config/restaurant';
import { formatPrice } from '../../data/menu';
import { payWithCard } from '../../services/payment';
import { useStore, useTier } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

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
    topUp(o.amount, o.bonus);
    notify('Yükleme başarılı', `${formatPrice(o.amount)} yüklendi, ${o.bonus} İnci kazandınız.`);
  }

  return (
    <Screen bottomInset={40}>
      <T v="hero">Kartım</T>
      <View style={{ marginTop: space.xl }}>
        <MemberCard />
      </View>

      <Card style={styles.qrCard}>
        <View style={styles.qrBox}>
          <QRCode value={code} size={176} color={colors.seaDeep} backgroundColor={colors.surface} />
        </View>
        <T v="h3" style={{ marginTop: space.lg }}>
          Hesabı öderken okutun
        </T>
        <T v="small" style={{ textAlign: 'center', marginTop: 4 }}>
          Garsonunuza ya da kasaya gösterin; hesap tutarınız kadar İnci yüklenir.{'\n'}Kod 30 saniyede bir yenilenir · Üye no: {user?.memberNo}
        </T>
      </Card>

      <View style={{ marginTop: space.xxl }}>
        <SectionTitle label="Deniz Kapısı Cüzdan" title={formatPrice(wallet)} />
        <T>Cüzdanınıza para yükleyin, ödemeyi tek dokunuşla yapın, bonus İnci kazanın.</T>
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
          {topUpOptions.map((o) => (
            <Pressable key={o.amount} onPress={() => (tap(), setAmount(o.amount))} style={[styles.topUp, amount === o.amount && styles.topUpActive]}>
              <Text style={[styles.topUpAmount, amount === o.amount && { color: colors.white }]}>{formatPrice(o.amount)}</Text>
              <Text style={[styles.topUpBonus, amount === o.amount && { color: '#BFE0F5' }]}>+{o.bonus} İnci</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => (tap(), doTopUp())} disabled={loading} style={[styles.topUpButton, loading && { opacity: 0.6 }]}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Icon name="wallet" size={18} color={colors.white} />}
          <Text style={styles.topUpButtonText}>{loading ? 'Ödeme bekleniyor…' : `${formatPrice(amount)} yükle`}</Text>
        </Pressable>
        <T v="small" style={{ marginTop: space.sm }}>
          Kullanılmayan bakiye, talep halinde yükleme yapılan karta iade edilir.
        </T>
      </View>

      {activeCoupons.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <SectionTitle label="Garsonunuza gösterin" title="Kuponlarım" />
          {activeCoupons.map((c) => (
            <View key={c.id} style={styles.coupon}>
              <View style={{ flex: 1 }}>
                <T v="h3">{c.title}</T>
                <T v="small">Son gün {new Date(c.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</T>
              </View>
              <Text style={styles.couponCode} selectable>
                {c.code}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: space.xxl }}>
        <SectionTitle label="İnci ile al" title="Ödüller" />
        {rewards.map((r) => {
          const enough = pearls >= r.cost;
          return (
            <View key={r.id} style={styles.reward}>
              <View style={styles.rewardIcon}>
                <Icon name="gift" size={20} color={colors.sea} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="h3">{r.title}</T>
                <T v="small">{r.note}</T>
              </View>
              <Chip
                label={`${r.cost} İnci`}
                active={enough}
                onPress={() => {
                  if (!enough) return notify('Yetersiz İnci', `${r.cost - pearls} İnci daha biriktirin.`);
                  const c = redeem(r.title, r.cost);
                  if (c) notify('Kuponunuz hazır', `${r.title} için kodunuz: ${c.code}\nKuponlarım bölümünde 30 gün geçerli.`);
                }}
              />
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionTitle label="Seviyeler" title={`Şu an: ${current.name}`} />
        {tiers.map((t) => (
          <View key={t.id} style={[styles.tier, t.id === current.id && styles.tierActive]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.tierName}>{t.name}</Text>
              <T v="small">{t.min === 0 ? 'Başlangıç' : `Yıllık ${formatPrice(t.min)}+`}</T>
            </View>
            {t.perks.map((p) => (
              <View key={p} style={{ flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <Icon name="check" size={14} color={colors.sea} strokeWidth={2.2} />
                <T style={{ fontSize: 13 }}>{p}</T>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionTitle title="Hareketler" />
        {activity.length === 0 && <T>Henüz hareket yok.</T>}
        {activity.slice(0, 12).map((a) => (
          <View key={a.id} style={styles.activity}>
            <View style={{ flex: 1 }}>
              <T v="h3">{a.title}</T>
              <T v="small">{new Date(a.at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</T>
            </View>
            {a.pearls !== undefined && a.pearls !== 0 && (
              <Text style={[styles.delta, { color: a.pearls > 0 ? colors.success : colors.coral }]}>
                {a.pearls > 0 ? '+' : ''}
                {a.pearls} İnci
              </Text>
            )}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: { marginTop: space.lg, alignItems: 'center', paddingVertical: space.xl },
  qrBox: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  topUp: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  topUpActive: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  topUpAmount: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  topUpBonus: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.sea, marginTop: 2 },
  topUpButton: {
    marginTop: space.md,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.seaDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  topUpButtonText: { fontFamily: fonts.bodySemi, color: colors.white, fontSize: 15 },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    marginBottom: space.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sea,
    backgroundColor: colors.foam,
  },
  couponCode: { fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 3, color: colors.seaDeep },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rewardIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.foam, alignItems: 'center', justifyContent: 'center' },
  tier: { padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: space.sm, backgroundColor: colors.surface },
  tierActive: { borderColor: colors.seaDeep, borderWidth: 1.5 },
  tierName: { fontFamily: fonts.display, fontSize: 21, color: colors.ink },
  activity: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  delta: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
});
