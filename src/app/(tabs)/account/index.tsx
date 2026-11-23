import { router } from 'expo-router';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { ListSection, Row, Screen, T } from '../../../components/ui';
import { ordering, restaurant } from '../../../config/restaurant';
import { formatPrice } from '../../../data/menu';
import { useStore, useTier } from '../../../store';
import { colors, font, space, textStyle } from '../../../theme';

export default function Account() {
  const { user, orders, signOut } = useStore();
  const { current } = useTier();

  // [alerts] geri alınamayan/yıkıcı eylem öncesi onay; yıkıcı düğme kırmızı (destructive)
  const confirmSignOut = () => {
    const go = () => {
      signOut();
      router.replace('/welcome');
    };
    if (Platform.OS === 'web') return go();
    Alert.alert('Çıkış yapılsın mı?', 'Bu telefondaki sipariş geçmişiniz ve kuponlarınız kaldırılır; İnci bakiyeniz hesabınızda kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: go },
    ]);
  };

  return (
    // [lists-and-tables › Style] Ayarlar düzeni: gruplanmış (inset grouped) listeler
    <Screen>
      <ListSection>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toLocaleUpperCase('tr-TR') ?? 'M'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <T v="small">
              {user?.phone} · {current.name} üye
            </T>
          </View>
        </View>
      </ListSection>

      <ListSection header="Siparişlerim">
        {orders.length === 0 && <Row title="Henüz siparişiniz yok" />}
        {orders.slice(0, 5).map((o) => (
          <Row
            key={o.id}
            icon="receipt"
            iconColor={o.paid ? colors.green : colors.orange}
            title={`${o.mode === 'masa' ? `${ordering.areaName} ${o.table}` : 'Gel-Al'} · ${formatPrice(o.total)}`}
            subtitle={`${new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${o.lines.length} ürün · ${o.paid ? 'ödendi' : 'hesapta'}`}
            onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
          />
        ))}
      </ListSection>

      <ListSection header="Deniz Kapısı">
        <Row icon="cake" iconColor={colors.orange} title="Pasta & davetler" onPress={() => router.push('/events')} />
        <Row icon="info" iconColor={colors.indigo} title="Hikayemiz" onPress={() => router.push('/about')} />
        <Row icon="music" iconColor={colors.red} title="Spotify listemiz" onPress={() => Linking.openURL(restaurant.spotify)} />
      </ListSection>

      <ListSection header="İletişim" footer="WhatsApp'tan genellikle dakikalar içinde yanıt veriyoruz.">
        <Row
          icon="help"
          iconColor={colors.accent}
          title="Yardım & destek"
          onPress={() => Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(`Merhaba, uygulama desteği istiyorum. Üye no: ${user?.memberNo ?? '-'}`)}`)}
        />
        <Row icon="pin" iconColor={colors.red} title="Yol tarifi" onPress={() => Linking.openURL(restaurant.mapsUrl)} />
        <Row icon="phone" iconColor={colors.green} title="Bizi arayın" subtitle={restaurant.phoneLabel} onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
      </ListSection>

      <ListSection header="Yasal">
        <Row icon="info" iconColor={colors.gray} title="KVKK Aydınlatma Metni" onPress={() => Linking.openURL(`${restaurant.website}/gizlilikpolitikasi`)} />
        <Row icon="info" iconColor={colors.gray} title="Şartlar ve Koşullar" onPress={() => Linking.openURL(`${restaurant.website}/sartlarvekosullar`)} />
      </ListSection>

      <ListSection footer={`Deniz Kapısı · Since ${restaurant.founded} · v1.0.0`}>
        <Row title="Çıkış yap" destructive onPress={confirmSignOut} />
      </ListSection>

      <Text accessibilityRole="button" onPress={() => router.push('/panel')} style={styles.staff}>
        Personel girişi
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gray, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.semibold, ...textStyle.title2, color: colors.onAccent },
  name: { ...font.semibold, ...textStyle.title3, color: colors.label },
  staff: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, textAlign: 'center', marginTop: space.lg, padding: space.md },
});
