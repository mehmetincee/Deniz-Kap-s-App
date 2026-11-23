import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { stackOptions } from '../components/navigation';
import { colors } from '../theme';

/**
 * Kök gezinme.
 * [typography › Developer note] "don't embed system fonts" → özel font yüklemesi kaldırıldı; açılışta
 *   font beklenmediği için uygulama daha hızlı açılır [launching].
 * [dark-mode] "people… expect all apps… to respect their preference" → durum çubuğu ve renkler sisteme uyar
 *   (app.json: userInterfaceStyle = automatic).
 * [sheets] ürün ve sepet sayfa (sheet) olarak açılır; aşağı kaydırarak kapanır.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.groupedBackground } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="product/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="order/[id]" options={{ ...stackOptions, headerShown: true, headerLargeTitle: false, title: 'Sipariş' }} />
        <Stack.Screen name="events" />
        <Stack.Screen name="about" />
        <Stack.Screen name="masa/[table]" options={{ animation: 'none' }} />
        {/* Panel bir iş ekranı: başlık şeffaf değil, içerik altından kaymaz */}
        <Stack.Screen
          name="panel"
          options={{ ...stackOptions, headerShown: true, headerTransparent: false, headerLargeTitle: false, headerBlurEffect: undefined, title: 'Personel' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
