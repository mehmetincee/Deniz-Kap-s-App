import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import type { ComponentProps } from 'react';

import { CartAccessory, cartUsesTabAccessory } from '../../components/CartBar';
import { useHydrated, useStore } from '../../store';
import { useT, type StringKey } from '../../i18n';
import { colors } from '../../theme';

type TabIcon = ComponentProps<typeof NativeTabs.Trigger.Icon>;

/**
 * Ana sekme çubuğu — iOS'un yerel UITabBar'ı.
 * [tab-bars › iOS] "A tab bar floats above content at the bottom of the screen. Its items rest on a Liquid Glass
 *   background" → yerel bileşen bunu kendiliğinden yapar [materials: "Standard components… pick up the appearance
 *   and behavior of this material automatically"]. Eski özel çizim ve ortadaki yükseltilmiş düğme kaldırıldı.
 * [tab-bars] "Use a tab bar to support navigation, not to provide actions" → beş sekme de bir bölüm.
 * [tab-bars] "Include tab labels… Use single words whenever possible" → Keşfet, Menü, Kartım, Rezervasyon, Hesabım.
 * [tab-bars] "Consider using SF Symbols… Prefer filled symbols" → seçiliyken .fill varyantı.
 * [tab-bars] "Avoid overflow tabs" → 5 sekme (iPhone'da More sekmesi oluşmaz).
 * Android'de aynı anlamlı Material simgeler (SF Symbols yalnızca Apple platformlarında kullanılabilir).
 */
const tabs: { name: string; label: StringKey; icon: TabIcon }[] = [
  { name: '(home)', label: 'tab.home', icon: { sf: { default: 'house', selected: 'house.fill' }, md: 'home' } },
  { name: 'menu', label: 'tab.menu', icon: { sf: { default: 'menucard', selected: 'menucard.fill' }, md: 'restaurant_menu' } },
  { name: 'card', label: 'tab.card', icon: { sf: 'qrcode', md: 'qr_code_2' } },
  { name: 'reservation', label: 'tab.reservation', icon: { sf: { default: 'calendar', selected: 'calendar' }, md: 'event' } },
  { name: 'account', label: 'tab.account', icon: { sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' }, md: 'account_circle' } },
];

export default function TabsLayout() {
  const user = useStore((s) => s.user);
  const { t: tr } = useT();
  const hasCart = useStore((s) => s.cart.length > 0);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (!user) return <Redirect href="/welcome" />;

  return (
    // [color › Liquid Glass color] sekme simge/yazıları tek renkli; seçili sekme uygulama vurgu rengiyle.
    // [tab-bars › iOS] kaydırınca sekme çubuğu küçülür, aksesuar (sepet) onunla aynı satıra geçer
    <NativeTabs tintColor={colors.accent} minimizeBehavior={hasCart ? 'onScrollDown' : 'never'}>
      {cartUsesTabAccessory && hasCart && (
        <NativeTabs.BottomAccessory>
          <CartAccessory />
        </NativeTabs.BottomAccessory>
      )}
      {tabs.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <NativeTabs.Trigger.Icon {...t.icon} />
          <NativeTabs.Trigger.Label>{tr(t.label)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
