import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '../../components/Icon';
import { Material } from '../../components/ui';
import { useHydrated, useStore } from '../../store';
import { colors, font, textStyle } from '../../theme';

/**
 * Web sürümü (QR'ı okutup uygulamayı indirmeden kullanan misafirler) için sekme çubuğu.
 * Yerel iOS sekme çubuğunun düzeni taklit edilir: altta, bulanık malzeme üstünde, simge + tek kelimelik etiket
 * [tab-bars › iOS], [tab-bars › "Include tab labels… single words"], [materials › Standard materials].
 * SF Symbols web'de kullanılamadığı için aynı anlamlı çizgi simgeler gösterilir [sf-symbols › lisans].
 */
const tabs: { name: string; label: string; icon: IconName }[] = [
  { name: '(home)', label: 'Keşfet', icon: 'home' },
  { name: 'menu', label: 'Menü', icon: 'menu' },
  { name: 'card', label: 'Kartım', icon: 'card' },
  { name: 'reservation', label: 'Rezervasyon', icon: 'calendar' },
  { name: 'account', label: 'Hesabım', icon: 'user' },
];

export default function TabsLayoutWeb() {
  const user = useStore((s) => s.user);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (!user) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent as string,
        tabBarInactiveTintColor: colors.gray as string,
        tabBarStyle: styles.bar,
        tabBarBackground: () => <Material style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.groupedBackground },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.label,
            tabBarIcon: ({ color, focused }) => <Icon name={t.icon} size={24} color={String(color)} strokeWidth={focused ? 2.1 : 1.6} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopColor: colors.separator, backgroundColor: 'transparent', height: 56 },
  label: { ...font.medium, ...textStyle.caption2 },
});
