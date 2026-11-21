import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton, Screen, T } from '../components/ui';
import { colors, fonts, radius, space } from '../theme';

const timeline = [
  { year: '1971', text: 'Mehmet İnce, İçmeler’in şifalı sularını keşfetmeye gelen misafirler için küçük bir pansiyon ve restoran açar.' },
  { year: '2. kuşak', text: 'Bakiye İnce mutfağa özgün dokunuşlar ve modern yorumlar katar; Ege’nin ruhu tabağa yansır.' },
  { year: 'Bugün', text: 'Üçüncü kuşak; bahçeden gelen taze otlar ve yerel pazar ürünleriyle geleneği bugünün mutfağıyla buluşturuyor.' },
];

export default function About() {
  return (
    <Screen padded={false} bottomInset={40} style={{ paddingTop: 0 }}>
      <View>
        <Image source={require('../../assets/images/chefs.jpg')} style={styles.hero} contentFit="cover" />
        <IconButton name="chevron-left" label="Geri" onPress={() => router.back()} style={styles.back} />
      </View>
      <View style={{ padding: space.xl }}>
        <T v="label">Hikayemiz</T>
        <T v="hero" style={{ marginTop: 6 }}>
          Lezzet, Ruh, Gelenek…
        </T>
        <T style={{ marginTop: space.lg, fontSize: 15, lineHeight: 23 }}>
          Deniz Kapısı, sadece bir restoran değil; nesiller boyu süren bir aile hikâyesi. Mutfakta anne ve oğulun emeği, bahçemizde
          yetişen taze otlar, her sabah pazardan özenle seçilen yerel ürünlerle birleşir. Bize gelen herkes bir misafir değil,
          soframızın bir parçasıdır.
        </T>

        <View style={{ marginTop: space.xxl }}>
          {timeline.map((t, i) => (
            <View key={t.year} style={styles.item}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.dot} />
                {i < timeline.length - 1 && <View style={styles.rail} />}
              </View>
              <View style={{ flex: 1, paddingBottom: space.xl }}>
                <Text style={styles.year}>{t.year}</Text>
                <T style={{ marginTop: 4 }}>{t.text}</T>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.photos}>
          <Image source={require('../../assets/images/heritage2.jpg')} style={styles.photo} contentFit="cover" />
          <Image source={require('../../assets/images/olive.jpg')} style={styles.photo} contentFit="cover" />
        </View>
        <Text style={styles.sign}>Bakiye ve Mehmet İnce</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 360 },
  back: { position: 'absolute', left: space.lg, top: 52 },
  item: { flexDirection: 'row', gap: space.lg },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.sky, marginTop: 6 },
  rail: { width: 1.5, flex: 1, backgroundColor: colors.line, marginTop: 4 },
  year: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  photos: { flexDirection: 'row', gap: space.md },
  photo: { flex: 1, height: 200, borderRadius: radius.lg },
  sign: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.inkSoft, marginTop: space.xl, textAlign: 'right' },
});
