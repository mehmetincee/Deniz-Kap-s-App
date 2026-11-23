import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { pct, useT } from '../i18n';
import { useStore, useTier } from '../store';
import { colors, font, radius, space, textStyle } from '../theme';

/** Sadakat kartı: lacivert zemin, dalga çizgileri, İnci bakiyesi ve seviye ilerlemesi. */
export function MemberCard({ compact }: { compact?: boolean }) {
  const user = useStore((s) => s.user);
  const pearls = useStore((s) => s.pearls);
  const { spend, current, next, progress } = useTier();
  const { t, locale, lang } = useT();
  const tierName = t(`tier.${current.id}`);

  return (
    // Kart bir "pass" gibi davranır: içerik katmanında düz renkli yüzey, Liquid Glass değil [materials].
    // Zemin systemIndigo: vurgu rengi (mavi) yalnızca etkileşimli öğelere ayrıldı [color › "Avoid using the same color to mean different things"].
    <View
      style={[styles.card, compact && { padding: space.lg }]}
      accessible
      accessibilityLabel={`${t('member.level', { tier: tierName })}, ${t('member.balance')}: ${pearls}`}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 200" preserveAspectRatio="none">
        <Path d="M0 150 C 60 130, 110 170, 170 150 S 280 130, 340 150 V200 H0Z" fill="rgba(255,255,255,0.06)" />
        <Path d="M0 170 C 70 150, 120 190, 180 170 S 290 155, 340 170 V200 H0Z" fill="rgba(255,255,255,0.07)" />
      </Svg>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.tier}>{t('member.level', { tier: tierName })} · {pct(current.rate, lang)}</Text>
        </View>
        <Image source={require('../../assets/images/mark-white.png')} style={{ width: 36, height: 36 }} contentFit="contain" accessibilityIgnoresInvertColors />
      </View>

      <View style={{ marginTop: compact ? space.md : space.xl }}>
        <Text style={styles.label}>{t('member.balance')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={styles.points}>{pearls.toLocaleString(locale)}</Text>
          <Text style={styles.pointsUnit}>{t('member.worth', { amount: pearls.toLocaleString(locale) })}</Text>
        </View>
      </View>

      {next && (
        <View style={{ marginTop: space.md }}>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.max(4, progress * 100)}%` }]} />
          </View>
          <Text style={styles.next}>
            {t('member.toNext', { tier: t(`tier.${next.id}`), amount: Math.max(0, next.min - spend).toLocaleString(locale) })} · {pct(next.rate, lang)}
          </Text>
        </View>
      )}
    </View>
  );
}

// Renkli zemin üstünde beyaz metin; ikincil metin için beyazın opaklığı düşürülür
// (sistemin secondaryLabel'ı da aynı yöntemi, opaklığı, kullanır) [color › iOS, iPadOS].
const styles = StyleSheet.create({
  card: { backgroundColor: colors.indigo, borderRadius: radius.xl, padding: space.xl, overflow: 'hidden' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { ...font.semibold, ...textStyle.headline, color: colors.onAccent },
  tier: { ...font.regular, ...textStyle.footnote, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  label: { ...font.regular, ...textStyle.footnote, color: 'rgba(255,255,255,0.75)' },
  points: { ...font.serifBold, ...textStyle.largeTitle, color: colors.onAccent },
  pointsUnit: { ...font.regular, ...textStyle.footnote, color: 'rgba(255,255,255,0.75)' },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.onAccent },
  next: { ...font.regular, ...textStyle.footnote, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
});
