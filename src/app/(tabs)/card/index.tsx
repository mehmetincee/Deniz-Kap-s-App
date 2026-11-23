import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Icon } from '../../../components/Icon';
import { MemberCard } from '../../../components/MemberCard';
import { useNow } from '../../../hooks/useNow';
import { CODE_WINDOW_MS, makeMemberCode, windowOf } from '../../../services/memberCode';
import { Button, Card, ListSection, Row, Screen, Segmented, T, tap } from '../../../components/ui';
import { ordering, rewards, tiers, topUpOptions } from '../../../config/restaurant';
import { pct, useT, type StringKey } from '../../../i18n';
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
  const { t, locale, lang } = useT();
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

  /** Seviyenin ayrıcalıkları: oran her seviyede; doğum günü herkese; üst seviyelerde ek ayrıcalıklar. */
  const perks = (i: number, rate: number) =>
    [
      t('card.perkRate', { rate: Math.round(rate * 100) }),
      t('card.perkBirthday'),
      i >= 1 && t('card.perkPriority'),
      i >= 3 && t('card.perkTasting'),
      i >= 4 && t('card.perkCaptain'),
    ].filter(Boolean) as string[];

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long' });

  return (
    <Screen>
      <MemberCard />

      {/* QR her iki görünüm modunda da beyaz zemin üstünde siyah kalır: okuyucular ters renkli kodu okuyamayabilir. */}
      <Card style={styles.qrCard}>
        <View style={styles.qrBox} accessible accessibilityLabel={t('card.scanTitle')}>
          <QRCode value={code} size={180} color="#000000" backgroundColor="#FFFFFF" />
        </View>
        <T v="h3" style={{ marginTop: space.lg }}>
          {t('card.scanTitle')}
        </T>
        <T v="small" style={{ textAlign: 'center', marginTop: 4 }}>
          {t('card.scanBody')}
        </T>
        <Text style={styles.memberNo} selectable>
          {user?.memberNo}
        </Text>
      </Card>

      {activeCoupons.length > 0 && (
        <ListSection header={t('card.coupons')} footer={t('card.couponsFooter')}>
          {activeCoupons.map((c) => (
            <Row
              key={c.id}
              icon={c.key === 'gift.birthday' ? 'cake' : 'gift'}
              iconColor={c.kind === 'gift' ? colors.orange : colors.indigo}
              title={c.key ? t(c.key) : c.title}
              subtitle={t('card.validUntil', { date: fmtDate(c.expiresAt) })}
              right={
                <Text style={styles.couponCode} selectable accessibilityLabel={c.code.split('').join(' ')}>
                  {c.code}
                </Text>
              }
            />
          ))}
        </ListSection>
      )}

      {/* Uygulama içi ödeme açıldığında cüzdan (para yükleme + bonus İnci) gösterilir */}
      {ordering.onlinePayment && (
        <ListSection header="Deniz Kapısı Cüzdan" footer="Kullanılmayan bakiye, talep halinde yükleme yapılan karta iade edilir.">
          <View style={styles.walletRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.walletLabel}>Bakiye</Text>
              <Text style={styles.walletValue}>{formatPrice(wallet)}</Text>
            </View>
          </View>
          <View style={{ padding: space.lg, gap: space.md }}>
            <Segmented value={amount} onChange={setAmount} options={topUpOptions.map((o) => ({ value: o.amount as number, label: formatPrice(o.amount) }))} />
            <Button title={`${formatPrice(amount)}`} icon="wallet" loading={loading} onPress={doTopUp} />
          </View>
        </ListSection>
      )}

      <ListSection header={t('card.rewards')} footer={t('card.rewardsFooter')}>
        {rewards.map((r) => {
          const enough = pearls >= r.cost;
          const title = t(`reward.${r.id}`);
          return (
            <Row
              key={r.id}
              icon="gift"
              iconColor={colors.indigo}
              title={title}
              subtitle={t(`reward.${r.id}Note`)}
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${title}, ${t('card.pearls', { n: r.cost })}`}
                  accessibilityState={{ disabled: !enough }}
                  accessibilityHint={enough ? undefined : t('card.needMore', { n: r.cost - pearls })}
                  disabled={!enough}
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    // Kupon "Kuponlarım" bölümünde hemen görünür; ayrıca bilgi penceresi açılmaz [alerts]
                    redeem(r.id, r.cost);
                  }}
                  style={[styles.costButton, !enough && { opacity: 0.45 }]}
                >
                  <Text style={styles.costText}>{t('card.pearls', { n: r.cost })}</Text>
                </Pressable>
              }
            />
          );
        })}
      </ListSection>

      <ListSection header={t('card.levels')} footer={t('card.levelsFooter')}>
        {tiers.map((tier, i) => (
          <Row
            key={tier.id}
            title={`${t(`tier.${tier.id}`)} · ${pct(tier.rate, lang)}`}
            subtitle={`${tier.min === 0 ? t('card.levelStart') : t('card.levelFrom', { amount: tier.min.toLocaleString(locale) })}\n${perks(i, tier.rate).join(' · ')}`}
            right={tier.id === current.id ? <Icon name="check" size={17} color={colors.accent} weight="semibold" /> : <View style={{ width: 17 }} />}
          />
        ))}
      </ListSection>

      <ListSection header={t('card.activity')}>
        {activity.length === 0 && <Row title={t('card.noActivity')} />}
        {activity.slice(0, 12).map((a) => (
          <Row
            key={a.id}
            title={a.key ? t(a.key, { title: a.params?.gift ? t(a.params.gift as StringKey) : '' }) : a.title}
            subtitle={new Date(a.at).toLocaleString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            right={
              a.pearls !== undefined && a.pearls !== 0 ? (
                // [color › Inclusive color] artı/eksi işareti de yazılır, yalnızca renk değil
                <Text style={[styles.delta, { color: a.pearls > 0 ? colors.green : colors.red }]}>
                  {a.pearls > 0 ? '+' : '−'}
                  {Math.abs(a.pearls)}
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
