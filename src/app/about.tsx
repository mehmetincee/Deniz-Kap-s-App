import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton, Screen, T } from '../components/ui';
import { useT } from '../i18n';
import { colors, font, radius, space } from '../theme';

const timeline = [1, 2, 3] as const;

export default function About() {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <Screen padded={false} bottomInset={40} style={{ paddingTop: 0 }}>
      <View>
        <Image source={require('../../assets/images/chefs.jpg')} style={styles.hero} contentFit="cover" />
        <IconButton name="chevron-left" label={t('common.back')} overMedia onPress={() => router.back()} style={[styles.back, { top: insets.top + space.sm }]} />
      </View>
      <View style={{ padding: space.xl }}>
        <T v="label">{t('about.kicker')}</T>
        <T v="hero" style={{ marginTop: 6 }}>
          {t('about.title')}
        </T>
        <T style={{ marginTop: space.lg, fontSize: 15, lineHeight: 20 }}>{t('about.body')}</T>

        <View style={{ marginTop: space.xxl }}>
          {timeline.map((n, i) => (
            <View key={n} style={styles.item}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.dot} />
                {i < timeline.length - 1 && <View style={styles.rail} />}
              </View>
              <View style={{ flex: 1, paddingBottom: space.xl }}>
                <Text style={styles.year}>{t(`about.y${n}`)}</Text>
                <T style={{ marginTop: 4 }}>{t(`about.t${n}`)}</T>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.photos}>
          <Image source={require('../../assets/images/heritage2.jpg')} style={styles.photo} contentFit="cover" />
          <Image source={require('../../assets/images/olive.jpg')} style={styles.photo} contentFit="cover" />
        </View>
        <Text style={styles.sign}>{t('about.sign')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 360 },
  back: { position: 'absolute', left: space.lg },
  item: { flexDirection: 'row', gap: space.lg },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.teal, marginTop: 6 },
  rail: { width: 1.5, flex: 1, backgroundColor: colors.separator, marginTop: 4 },
  year: { ...font.serif, fontSize: 22, color: colors.label },
  photos: { flexDirection: 'row', gap: space.md },
  photo: { flex: 1, height: 200, borderRadius: radius.lg },
  sign: { ...font.serifItalic, fontSize: 22, color: colors.secondaryLabel, marginTop: space.xl, textAlign: 'right' },
});
