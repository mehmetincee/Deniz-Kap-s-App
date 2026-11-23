import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

import { colors } from '../theme';

const ios = Platform.OS === 'ios';
const glass = ios && isLiquidGlassAvailable();

/**
 * Sekme içi yerel gezinme çubuğu ayarları.
 * [toolbars] "Use a large title to help people stay oriented as they navigate and scroll. By default, a large
 *   title transitions to a standard title as people begin scrolling" → headerLargeTitle.
 * [layout › Differentiate controls from content] "Instead of applying a solid or semi-opaque background color
 *   beneath controls, use a scroll edge effect" → iOS'ta şeffaf başlık; iOS 26'da sistem Liquid Glass ve kaydırma
 *   kenarı efektini kendisi uygular. Daha eski iOS'ta sistem malzemesi (systemChromeMaterial) [materials › Standard materials].
 * [toolbars] başlıklar 15 karakterin altında tutuldu; uygulama adı başlık olarak kullanılmadı.
 */
export const stackOptions = {
  headerLargeTitle: true,
  // [toolbars] "Use the standard Back… Prefer the standard symbols… don't use a text label that says Back"
  headerBackButtonDisplayMode: 'minimal' as const,
  headerTransparent: ios,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBlurEffect: ios && !glass ? ('systemChromeMaterial' as const) : undefined,
  headerStyle: ios ? undefined : { backgroundColor: colors.groupedBackground },
  headerTintColor: colors.accent as string,
  headerTitleStyle: { color: colors.label as string },
  headerLargeTitleStyle: { color: colors.label as string },
  contentStyle: { backgroundColor: colors.groupedBackground },
};
