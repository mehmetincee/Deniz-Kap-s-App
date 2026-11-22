import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CartBar } from '../../components/CartBar';
import { Icon, type IconName } from '../../components/Icon';
import { MemberCard } from '../../components/MemberCard';
import { Card, Screen, SectionTitle, T, tap } from '../../components/ui';
import { ordering, restaurant } from '../../config/restaurant';
import { currentServiceId, featured, formatPrice, services } from '../../data/menu';
import { liveStatus, useStore } from '../../store';
import { colors, fonts, radius, shadow, space } from '../../theme';

function greeting(h = new Date().getHours()) {
  if (h < 5) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const actions: { icon: IconName; title: string; sub: string; go: () => void }[] = [
  {
    icon: 'wave',
    title: `${ordering.areaName}dan sipariş`,
    sub: 'Plaj menüsü ve içecekler',
    go: () => router.push({ pathname: '/menu', params: { mode: 'masa', service: 'oglen' } }),
  },
  ordering.pickup
    ? { icon: 'bag', title: 'Gel-Al', sub: 'Hazır olunca gel', go: () => router.push({ pathname: '/menu', params: { mode: 'gelal' } }) }
    : { icon: 'card', title: 'İnci kazan', sub: 'Hesapta kartını okut', go: () => router.push('/card') },
  { icon: 'calendar', title: 'Rezervasyon', sub: 'Masanı ayırt', go: () => router.push('/reservation') },
  { icon: 'cake', title: 'Pasta & Davet', sub: 'Özel günler', go: () => router.push('/events') },
];

export default function Home() {
  const user = useStore((s) => s.user);
  const activeOrder = useStore((s) => s.orders.find((o) => liveStatus(o) !== 'teslim'));
  const service = services.find((s) => s.id === currentServiceId())!;
  const picks = featured();

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={100}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <T v="label">{greeting()}</T>
            <T v="hero" style={{ marginTop: 4 }}>
              {user?.name?.split(' ')[0] ?? 'Hoş geldiniz'}
            </T>
          </View>
          <Image source={require('../../../assets/images/mark.png')} style={{ width: 44, height: 44 }} contentFit="contain" />
        </View>

        <Pressable onPress={() => (tap(), router.push('/card'))} style={{ marginTop: space.xl }}>
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
            <Icon name="chevron-right" size={18} color={colors.muted} />
          </Card>
        )}

        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.title} onPress={() => (tap(), a.go())} style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}>
              <View style={styles.actionIcon}>
                <Icon name={a.icon} size={22} color={colors.sea} />
              </View>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: space.xxl }}>
          <SectionTitle label={`Şu an servis · ${service.hours}`} title="Şefin seçtikleri" action="Menü" onAction={() => router.push('/menu')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.md }}>
          {picks.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => (tap(), router.push({ pathname: '/product/[id]', params: { id: p.id } }))}
              style={({ pressed }) => [styles.pick, pressed && { opacity: 0.85 }]}
            >
              {p.image ? (
                <Image source={p.image} style={styles.pickImage} contentFit="cover" />
              ) : (
                <View style={[styles.pickImage, styles.pickPlaceholder]}>
                  <Text style={styles.pickInitial}>{p.name[0]}</Text>
                </View>
              )}
              <Text style={styles.pickName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.pickPrice}>{formatPrice(p.price)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable onPress={() => (tap(), router.push('/about'))} style={[styles.story, { marginTop: space.xxl }]}>
          <Image source={require('../../../assets/images/heritage.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,24,40,0.42)' }]} />
          <Text style={styles.storyKicker}>HİKAYEMİZ</Text>
          <Text style={styles.storyTitle}>1971’den beri{'\n'}üç kuşak, tek sofra.</Text>
          <Text style={styles.storyLink}>Devamını oku →</Text>
        </Pressable>

        <Card style={{ marginTop: space.xl }}>
          <View style={styles.infoRow}>
            <Icon name="clock" size={18} color={colors.sea} />
            <T style={{ flex: 1 }}>Restoran {restaurant.hours.restaurant} · Mutfak {restaurant.hours.kitchen}</T>
          </View>
          <Pressable style={styles.infoRow} onPress={() => Linking.openURL(restaurant.mapsUrl)}>
            <Icon name="pin" size={18} color={colors.sea} />
            <T style={{ flex: 1 }}>{restaurant.address}</T>
          </Pressable>
          <View style={styles.contactRow}>
            <ContactButton icon="phone" label="Ara" onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
            <ContactButton icon="message" label="WhatsApp" onPress={() => Linking.openURL(restaurant.whatsapp)} />
            <ContactButton icon="instagram" label="Instagram" onPress={() => Linking.openURL(restaurant.instagram)} />
          </View>
        </Card>
      </Screen>
      <CartBar />
    </View>
  );
}

function ContactButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => (tap(), onPress())} style={styles.contact}>
      <Icon name={icon} size={18} color={colors.seaDeep} />
      <Text style={styles.contactText}>{label}</Text>
    </Pressable>
  );
}

const statusText = { alindi: 'alındı', hazirlaniyor: 'hazırlanıyor', hazir: 'hazır', teslim: 'teslim edildi' } as const;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  orderCard: { marginTop: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl },
  action: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.foam,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  actionTitle: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  actionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  pick: { width: 150 },
  pickImage: { width: 150, height: 170, borderRadius: radius.lg },
  pickPlaceholder: { backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center' },
  pickInitial: { fontFamily: fonts.displayItalic, fontSize: 64, color: colors.inkSoft, opacity: 0.5 },
  pickName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginTop: space.sm },
  pickPrice: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  story: { height: 210, borderRadius: radius.lg, overflow: 'hidden', padding: space.xl, justifyContent: 'flex-end' },
  storyKicker: { fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' },
  storyTitle: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.white, marginTop: 6 },
  storyLink: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.white, marginTop: space.md },
  infoRow: { flexDirection: 'row', gap: space.md, alignItems: 'center', paddingVertical: 6 },
  contactRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  contact: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.foam,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.seaDeep },
});
