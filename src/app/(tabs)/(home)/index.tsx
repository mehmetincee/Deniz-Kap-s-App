import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CartBar } from '../../../components/CartBar';
import { Icon, type IconName } from '../../../components/Icon';
import { MemberCard } from '../../../components/MemberCard';
import { Card, ListSection, Row, Screen, SectionTitle, T, tap } from '../../../components/ui';
import { ordering, restaurant } from '../../../config/restaurant';
import { currentServiceId, featured, formatPrice, localize, services } from '../../../data/menu';
import { useNow } from '../../../hooks/useNow';
import { useT, type StringKey } from '../../../i18n';
import { liveStatus, useStore } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

function greetingKey(h = new Date().getHours()): StringKey {
  if (h < 5) return 'greet.night';
  if (h < 12) return 'greet.morning';
  if (h < 18) return 'greet.day';
  return 'greet.evening';
}

type Action = { icon: IconName; tint: keyof typeof colors; title: StringKey; sub: StringKey; go: () => void };

const actions: Action[] = [
  // Sipariş kapalıyken uygulama QR menü gibi çalışır: ilk eylem menüye göz atmak
  ordering.enabled
    ? { icon: 'wave', tint: 'teal', title: 'home.menuTitle', sub: 'home.menuSub', go: () => router.push({ pathname: '/menu', params: { mode: 'masa', service: 'oglen' } }) }
    : { icon: 'menu', tint: 'teal', title: 'home.menuTitle', sub: 'home.menuSub', go: () => router.push('/menu') },
  { icon: 'card', tint: 'indigo', title: 'home.earnTitle', sub: 'home.earnSub', go: () => router.push('/card') },
  { icon: 'calendar', tint: 'red', title: 'home.reserveTitle', sub: 'home.reserveSub', go: () => router.push('/reservation') },
  { icon: 'cake', tint: 'orange', title: 'home.eventsTitle', sub: 'home.eventsSub', go: () => router.push('/events') },
];

export default function Home() {
  const { t, lang } = useT();
  const activeOrder = useStore((s) => (ordering.enabled ? s.orders.find((o) => liveStatus(o) !== 'teslim') : undefined));
  const coupons = useStore((s) => s.coupons);
  const grantBirthdayGift = useStore((s) => s.grantBirthdayGift);
  const now = useNow(60000);
  const gift = coupons.find((c) => c.kind === 'gift' && !c.used && new Date(c.expiresAt).getTime() > now);
  const service = services.find((s) => s.id === currentServiceId())!;
  const picks = featured();

  // Doğum günü penceresine girildiyse tatlı kuponu oluşturulur (yılda bir)
  useEffect(() => {
    grantBirthdayGift();
  }, [grantBirthdayGift]);

  return (
    <View style={{ flex: 1 }}>
      {/* [toolbars] başlık görünümün amacını söyler; uygulama adı başlık yapılmaz. */}
      <Stack.Screen options={{ title: t(greetingKey()) }} />
      <Screen bottomInset={90}>
        {/* [layout › Visual hierarchy] en önemli içerik (ikram, kart) en üstte */}
        {gift && (
          <Card style={styles.giftCard} onPress={() => router.push('/card')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.orange, marginBottom: 0 }]}>
              <Icon name={gift.key === 'gift.birthday' ? 'cake' : 'gift'} size={19} color={colors.onAccent} weight="medium" />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h3">{gift.key ? t(gift.key) : gift.title}</T>
              <T v="small">{t('home.giftShow')}</T>
            </View>
            <Icon name="chevron-right" size={14} color={colors.tertiaryLabel} weight="semibold" />
          </Card>
        )}

        <Pressable accessibilityRole="button" onPress={() => (tap(), router.push('/card'))} style={gift ? { marginTop: space.md } : undefined}>
          <MemberCard compact />
        </Pressable>

        {activeOrder && (
          <Card style={styles.orderCard} onPress={() => router.push({ pathname: '/order/[id]', params: { id: activeOrder.id } })}>
            <View style={styles.pulse} />
            <View style={{ flex: 1 }}>
              <T v="h3">Siparişiniz {statusText[liveStatus(activeOrder)]}</T>
              <T v="small">
                {activeOrder.mode === 'masa' ? `${ordering.areaName} ${activeOrder.table}` : `Gel-Al · ${activeOrder.pickupTime}`} · #{activeOrder.id.slice(-5)}
              </T>
            </View>
            <Icon name="chevron-right" size={14} color={colors.tertiaryLabel} weight="semibold" />
          </Card>
        )}

        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.title} accessibilityRole="button" onPress={() => (tap(), a.go())} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}>
              {/* [sf-symbols › Rendering modes] beyaz simge + sistem rengi zemin (Ayarlar uygulaması dili) */}
              <View style={[styles.actionIcon, { backgroundColor: colors[a.tint] }]}>
                <Icon name={a.icon} size={19} color={colors.onAccent} weight="medium" />
              </View>
              <Text style={styles.actionTitle}>{t(a.title)}</Text>
              <Text style={styles.actionSub}>{t(a.sub)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: space.xxl }}>
          <SectionTitle
            label={t('home.nowServing', { hours: service.hours })}
            title={t('home.chefPicks')}
            action={t('home.all')}
            onAction={() => router.push('/menu')}
          />
        </View>
        {/* [layout › progressive disclosure] "use scrollable sections to showcase additional content" */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}>
          {picks.map((p) => {
            const l = localize(p, lang);
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`${l.title}, ${formatPrice(p.price)}`}
                onPress={() => (tap(), router.push({ pathname: '/product/[id]', params: { id: p.id } }))}
                style={({ pressed }) => [styles.pick, pressed && { opacity: 0.7 }]}
              >
                {p.image ? (
                  <Image source={p.image} style={styles.pickImage} contentFit="cover" />
                ) : (
                  <View style={[styles.pickImage, styles.pickPlaceholder]}>
                    <Text style={styles.pickInitial}>{l.title[0]}</Text>
                  </View>
                )}
                <Text style={styles.pickName} numberOfLines={1}>
                  {l.title}
                </Text>
                <Text style={styles.pickPrice}>{formatPrice(p.price)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable accessibilityRole="button" onPress={() => (tap(), router.push('/about'))} style={[styles.story, { marginTop: space.xxl }]}>
          <Image source={require('../../../../assets/images/heritage.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          {/* [materials] parlak fotoğraf üstündeki metin için ~%35 karartma */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
          <Text style={styles.storyKicker}>{t('home.storyKicker')}</Text>
          <Text style={styles.storyTitle}>{t('home.storyTitle')}</Text>
        </Pressable>

        {/* [lists-and-tables] "Prefer displaying text in a list" → iletişim bilgileri gruplanmış liste */}
        <ListSection header={t('home.visit')} footer={t('home.kitchenFooter', { hours: restaurant.hours.kitchen })}>
          <Row icon="clock" iconColor={colors.gray} title={t('home.everyDay', { hours: restaurant.hours.restaurant })} />
          <Row icon="pin" iconColor={colors.red} title={t('home.directions')} subtitle={restaurant.address} onPress={() => Linking.openURL(restaurant.mapsUrl)} />
          <Row icon="phone" iconColor={colors.green} title={t('home.call')} subtitle={restaurant.phoneLabel} onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
          <Row icon="message" iconColor={colors.green} title="WhatsApp" subtitle={restaurant.mobileLabel} onPress={() => Linking.openURL(restaurant.whatsapp)} />
          <Row icon="instagram" iconColor={colors.indigo} title="Instagram" subtitle="@denizkapisi" onPress={() => Linking.openURL(restaurant.instagram)} />
        </ListSection>
      </Screen>
      <CartBar />
    </View>
  );
}

const statusText = { alindi: 'alındı', hazirlaniyor: 'hazırlanıyor', hazir: 'hazır', teslim: 'teslim edildi' } as const;

const styles = StyleSheet.create({
  giftCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  orderCard: { marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
  action: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.secondaryGroupedBackground,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  actionIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  actionTitle: { ...font.semibold, ...textStyle.subhead, color: colors.label },
  actionSub: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: 2 },
  pick: { width: 150 },
  pickImage: { width: 150, height: 170, borderRadius: radius.lg },
  pickPlaceholder: { backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  pickInitial: { ...font.serifItalic, ...textStyle.largeTitle, color: colors.tertiaryLabel },
  pickName: { ...font.serif, ...textStyle.headline, color: colors.label, marginTop: space.sm },
  pickPrice: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: 1 },
  story: { height: 200, borderRadius: radius.xl, overflow: 'hidden', padding: space.xl, justifyContent: 'flex-end' },
  storyKicker: { ...font.semibold, ...textStyle.footnote, color: colors.onAccent },
  storyTitle: { ...font.serifBold, ...textStyle.title1, color: colors.onAccent, marginTop: 4 },
});
