import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, Row, Screen, SectionTitle, T } from '../../components/ui';
import { ordering, restaurant } from '../../config/restaurant';
import { formatPrice } from '../../data/menu';
import { useStore, useTier } from '../../store';
import { colors, fonts, space } from '../../theme';

export default function Account() {
  const { user, orders, signOut } = useStore();
  const { current } = useTier();

  return (
    <Screen bottomInset={40}>
      <T v="hero">Hesabım</T>
      <Card style={{ marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toLocaleUpperCase('tr-TR') ?? 'M'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <T v="h2">{user?.name}</T>
          <T v="small">
            {user?.phone} · {current.name}
          </T>
        </View>
      </Card>

      <View style={{ marginTop: space.xxl }}>
        <SectionTitle title="Siparişlerim" />
        {orders.length === 0 && <T>Henüz siparişiniz yok.</T>}
        {orders.slice(0, 5).map((o) => (
          <Row
            key={o.id}
            icon="receipt"
            title={`${o.mode === 'masa' ? `${ordering.areaName} ${o.table}` : 'Gel-Al'} · ${formatPrice(o.total)}${o.paid ? '' : ' · ödenmedi'}`}
            subtitle={`${new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${o.lines.length} ürün`}
            onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
          />
        ))}
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionTitle title="Deniz Kapısı" />
        <Row icon="cake" title="Pasta siparişi & davetler" subtitle="Doğum günü, düğün, kurumsal etkinlik" onPress={() => router.push('/events')} />
        <Divider />
        <Row icon="info" title="Hikayemiz" subtitle="1971'den bugüne" onPress={() => router.push('/about')} />
        <Divider />
        <Row
          icon="help"
          title="Yardım & destek"
          subtitle="WhatsApp'tan genellikle dakikalar içinde yanıt"
          onPress={() => Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(`Merhaba, uygulama desteği istiyorum. Üye no: ${user?.memberNo ?? '-'}`)}`)}
        />
        <Divider />
        <Row icon="pin" title="Yol tarifi" subtitle={restaurant.address} onPress={() => Linking.openURL(restaurant.mapsUrl)} />
        <Divider />
        <Row icon="phone" title="Bizi arayın" subtitle={restaurant.phoneLabel} onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
        <Divider />
        <Row icon="message" title="WhatsApp" subtitle={restaurant.mobileLabel} onPress={() => Linking.openURL(restaurant.whatsapp)} />
        <Divider />
        <Row icon="music" title="Spotify listemiz" subtitle="Restoranda çalanlar" onPress={() => Linking.openURL(restaurant.spotify)} />
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionTitle title="Yasal" />
        <Row icon="info" title="KVKK Aydınlatma Metni" onPress={() => Linking.openURL(`${restaurant.website}/gizlilikpolitikasi`)} />
        <Divider />
        <Row icon="info" title="Şartlar ve Koşullar" onPress={() => Linking.openURL(`${restaurant.website}/sartlarvekosullar`)} />
        <Divider />
        <Row
          icon="logout"
          title="Çıkış yap"
          onPress={() => {
            signOut();
            router.replace('/welcome');
          }}
        />
      </View>
      <T v="small" style={{ textAlign: 'center', marginTop: space.xl }}>
        Deniz Kapısı · Since {restaurant.founded} · v1.0.0
      </T>
      <Text onPress={() => router.push('/panel')} style={styles.staff}>
        Personel girişi
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.seaDeep, alignItems: 'center', justifyContent: 'center' },
  staff: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.md, padding: space.sm },
  avatarText: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
});
