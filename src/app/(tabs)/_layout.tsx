import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '../../components/Icon';
import { useHydrated, useStore } from '../../store';
import { colors, fonts } from '../../theme';

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Ana Sayfa', icon: 'home' },
  { name: 'menu', title: 'Menü', icon: 'menu' },
  { name: 'card', title: 'Kartım', icon: 'card' },
  { name: 'reservation', title: 'Rezervasyon', icon: 'calendar' },
  { name: 'account', title: 'Hesabım', icon: 'user' },
];

export default function TabsLayout() {
  const user = useStore((s) => s.user);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (!user) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.seaDeep,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.sand },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) =>
              t.name === 'card' ? (
                <View style={[styles.center, focused && { backgroundColor: colors.sky }]}>
                  <Icon name={t.icon} size={22} color={colors.white} />
                </View>
              ) : (
                <Icon name={t.icon} size={22} color={String(color)} strokeWidth={focused ? 2 : 1.6} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    height: 84,
    paddingTop: 8,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5 },
  center: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.seaDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
});
