import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CartBar } from '../../../components/CartBar';
import { Icon, type IconName } from '../../../components/Icon';
import { MemberCard } from '../../../components/MemberCard';
import { Card, ListSection, Row, Screen, SectionTitle, T, tap } from '../../../components/ui';
import { ordering, restaurant } from '../../../config/restaurant';
import { currentServiceId, featured, formatPrice, services } from '../../../data/menu';
import { liveStatus, useStore } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

function greeting(h = new Date().getHours()) {
  if (h < 5) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const actions: { icon: IconName; tint: keyof typeof colors; title: string; sub: string; go: () => void }[] = [
  {
    icon: 'wave',
    tint: 'teal',
    title: `${ordering.areaName}dan sipariş`,
    sub: 'Plaj menüsü ve içecekler',
    go: () => router.push({ pathname: '/menu', params: { mode: 'masa', service: 'oglen' } }),
  },
  ordering.pickup
    ? { icon: 'bag', tint: 'orange', title: 'Gel-Al', sub: 'Hazır olunca gel', go: () => router.push({ pathname: '/menu', params: { mode: 'gelal' } }) }
    : { icon: 'card', tint: 'indigo', title: 'İnci kazan', sub: 'Hesapta kartını okut', go: () => router.push('/card') },
  { icon: 'calendar', tint: 'red', title: 'Rezervasyon', sub: 'Masanı ayırt', go: () => router.push('/reservation') },
  { icon: 'cake', tint: 'orange', title: 'Pasta & Davet', sub: 'Özel günler', go: () => router.push('/events') },
];

export default function Home() {
  const activeOrder = useStore((s) => s.orders.find((o) => liveStatus(o) !== 'teslim'));
  const service = services.find((s) => s.id === currentServiceId())!;
  const picks = featured();

  return (
    <View style={{ flex: 1 }}>
      {/* [toolbars] başlık görünümün amacını söyler; uygulama adı başlık yapılmaz. */}
      <Stack.Screen options={{ title: greeting() }} />
      <Screen bottomInset={90}>
        {/* [layout › Visual hierarchy] en önemli içerik (kart ve aktif sipariş) en üstte */}
        <Pressable accessibilityRole="button" accessibilityLabel="Kartımı aç" onPress={() => (tap(), router.push('/card'))}>
          <MemberCard compact />
        </Pressable>

        {activeOrder && (
          <Card style={styles.orderCard} onPress={() => router.push({ pathname: '/order/[id]', params: { id: activeOrder.id } })}>
            {/* [color › Inclusive color] durum yalnızca renkle değil, metinle de verilir */}
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
            <Pressable
              key={a.title}
              accessibilityRole="button"
              onPress={() => (tap(), a.go())}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
            >
              {/* [sf-symbols › Rendering modes] beyaz simge + sistem rengi zemin (Ayarlar uygulaması dili) */}
              <View style={[styles.actionIcon, { backgroundColor: colors[a.tint] }]}>
                <Icon name={a.icon} size={19} color={colors.onAccent} weight="medium" />
              </View>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: space.xxl }}>
          <SectionTitle label={`Şu an servis · ${service.hours}`} title="Şefin seçtikleri" action="Tümü" onAction={() => router.push('/menu')} />
        </View>
        {/* [layout › progressive disclosure] "use scrollable sections to showcase additional content" */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}>
          {picks.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${formatPrice(p.price)}`}
              onPress={() => (tap(), router.push({ pathname: '/product/[id]', params: { id: p.id } }))}
              style={({ pressed }) => [styles.pick, pressed && { opacity: 0.7 }]}
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

        <Pressable accessibilityRole="button" onPress={() => (tap(), router.push('/about'))} style={[styles.story, { marginTop: space.xxl }]}>
          <Image source={require('../../../../assets/images/heritage.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          {/* [materials] parlak fotoğraf üstündeki metin için ~%35 karartma */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
          <Text style={styles.storyKicker}>Hikayemiz</Text>
          <Text style={styles.storyTitle}>1971’den beri{'\n'}üç kuşak, tek sofra.</Text>
        </Pressable>

        {/* [lists-and-tables] "Prefer displaying text in a list" → iletişim bilgileri gruplanmış liste */}
        <ListSection header="Ziyaret" footer={`Mutfak ${restaurant.hours.kitchen} arası sipariş alır.`}>
          <Row icon="clock" iconColor={colors.gray} title={`Her gün ${restaurant.hours.restaurant}`} />
          <Row icon="pin" iconColor={colors.red} title="Yol tarifi" subtitle={restaurant.address} onPress={() => Linking.openURL(restaurant.mapsUrl)} />
          <Row icon="phone" iconColor={colors.green} title="Ara" subtitle={restaurant.phoneLabel} onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
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
