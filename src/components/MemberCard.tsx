import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useStore, useTier } from '../store';
import { colors, fonts, radius, space } from '../theme';

/** Sadakat kartı: lacivert zemin, dalga çizgileri, İnci bakiyesi ve seviye ilerlemesi. */
export function MemberCard({ compact }: { compact?: boolean }) {
  const user = useStore((s) => s.user);
  const pearls = useStore((s) => s.pearls);
  const { spend, current, next, progress } = useTier();

  return (
    <View style={[styles.card, compact && { padding: space.lg }]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 200" preserveAspectRatio="none">
        <Path d="M0 150 C 60 130, 110 170, 170 150 S 280 130, 340 150 V200 H0Z" fill="rgba(255,255,255,0.05)" />
        <Path d="M0 170 C 70 150, 120 190, 180 170 S 290 155, 340 170 V200 H0Z" fill="rgba(255,255,255,0.06)" />
      </Svg>
      <View style={styles.top}>
        <View>
          <Text style={styles.tier}>{current.name}</Text>
          {!compact && <Text style={styles.name}>{user?.name ?? 'Misafirimiz'}</Text>}
        </View>
        <Image source={require('../../assets/images/mark-white.png')} style={{ width: 40, height: 40, opacity: 0.9 }} contentFit="contain" />
      </View>

      <View style={{ marginTop: compact ? space.md : space.xl }}>
        <Text style={styles.label}>İNCİ BAKİYESİ</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={styles.points}>{pearls.toLocaleString('tr-TR')}</Text>
          <Text style={styles.pointsUnit}>İnci · ₺{pearls.toLocaleString('tr-TR')} değerinde</Text>
        </View>
      </View>

      {next && (
        <View style={{ marginTop: space.md }}>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.max(4, progress * 100)}%` }]} />
          </View>
          <Text style={styles.next}>
            {next.name} seviyesine ₺{Math.max(0, next.min - spend).toLocaleString('tr-TR')} kaldı
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.seaDeep,
    borderRadius: radius.lg,
    padding: space.xl,
    overflow: 'hidden',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tier: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: '#9FC6EA', textTransform: 'uppercase' },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.white, marginTop: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.6, color: 'rgba(255,255,255,0.6)' },
  points: { fontFamily: fonts.display, fontSize: 40, color: colors.white, marginTop: 2 },
  pointsUnit: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.sky },
  next: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
});
