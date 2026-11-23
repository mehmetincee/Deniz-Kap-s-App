import { router } from 'expo-router';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { ListSection, Row, Screen, Segmented, T } from '../../../components/ui';
import { dayMonth, languages, localeOf, useT } from '../../../i18n';
import { ordering, restaurant } from '../../../config/restaurant';
import { formatPrice } from '../../../data/menu';
import { useStore, useTier } from '../../../store';
import { colors, font, space, textStyle } from '../../../theme';

export default function Account() {
  const { t, lang } = useT();
  const { user, orders, signOut, setLang } = useStore();
  const { current } = useTier();

  // [alerts] geri alınamayan eylem öncesi onay; yıkıcı düğme kırmızı (destructive)
  const confirmSignOut = () => {
    const go = () => {
      signOut();
      router.replace('/welcome');
    };
    if (Platform.OS === 'web') return go();
    Alert.alert(t('acc.signOutTitle'), t('acc.signOutBody'), [
      { text: t('acc.cancel'), style: 'cancel' },
      { text: t('acc.signOut'), style: 'destructive', onPress: go },
    ]);
  };

  return (
    // [lists-and-tables › Style] Ayarlar düzeni: gruplanmış (inset grouped) listeler
    <Screen>
      <ListSection>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toLocaleUpperCase(localeOf(lang)) ?? '·'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <T v="small">
              {user?.phone} · {t('acc.memberSince', { tier: t(`tier.${current.id}`) })}
            </T>
          </View>
        </View>
        <Row
          icon="cake"
          iconColor={colors.orange}
          title={t('acc.birthday')}
          right={<Text style={styles.value}>{user?.birthday ? dayMonth(lang, user.birthday.day, user.birthday.month) : t('acc.birthdayNotSet')}</Text>}
        />
      </ListSection>

      {/* Dil: uygulamanın her yerinde geçerli; menü de seçili dilde gösterilir */}
      <ListSection header={t('acc.language')}>
        <View style={{ padding: space.md }}>
          <Segmented value={lang} onChange={setLang} options={languages.map((l) => ({ value: l, label: t(`lang.${l}`) }))} />
        </View>
      </ListSection>

      {ordering.enabled && orders.length > 0 && (
        <ListSection header="Siparişlerim">
          {orders.slice(0, 5).map((o) => (
            <Row
              key={o.id}
              icon="receipt"
              iconColor={o.paid ? colors.green : colors.orange}
              title={`${o.mode === 'masa' ? `${ordering.areaName} ${o.table}` : 'Gel-Al'} · ${formatPrice(o.total)}`}
              subtitle={`${new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${o.lines.length} ürün`}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
            />
          ))}
        </ListSection>
      )}

      <ListSection header={t('acc.denizKapisi')}>
        <Row icon="cake" iconColor={colors.orange} title={t('acc.events')} onPress={() => router.push('/events')} />
        <Row icon="info" iconColor={colors.indigo} title={t('acc.story')} onPress={() => router.push('/about')} />
        <Row icon="music" iconColor={colors.red} title={t('acc.spotify')} onPress={() => Linking.openURL(restaurant.spotify)} />
      </ListSection>

      <ListSection header={t('acc.contact')} footer={t('acc.contactFooter')}>
        <Row
          icon="help"
          iconColor={colors.accent}
          title={t('acc.help')}
          onPress={() => Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(t('acc.helpMsg', { no: user?.memberNo ?? '-' }))}`)}
        />
        <Row icon="pin" iconColor={colors.red} title={t('acc.directions')} onPress={() => Linking.openURL(restaurant.mapsUrl)} />
        <Row icon="phone" iconColor={colors.green} title={t('acc.callUs')} subtitle={restaurant.phoneLabel} onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} />
      </ListSection>

      <ListSection header={t('acc.legal')}>
        <Row icon="info" iconColor={colors.gray} title={t('acc.kvkk')} onPress={() => Linking.openURL(`${restaurant.website}/gizlilikpolitikasi`)} />
        <Row icon="info" iconColor={colors.gray} title={t('acc.terms')} onPress={() => Linking.openURL(`${restaurant.website}/sartlarvekosullar`)} />
      </ListSection>

      <ListSection footer={`Deniz Kapısı · Since ${restaurant.founded} · v1.1.0`}>
        <Row title={t('acc.signOut')} destructive onPress={confirmSignOut} />
      </ListSection>

      <Text accessibilityRole="button" onPress={() => router.push('/panel')} style={styles.staff}>
        {t('acc.staff')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gray, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.semibold, ...textStyle.title2, color: colors.onAccent },
  name: { ...font.semibold, ...textStyle.title3, color: colors.label },
  value: { ...font.regular, ...textStyle.body, color: colors.secondaryLabel },
  staff: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, textAlign: 'center', marginTop: space.lg, padding: space.md },
});
