import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, type ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

export type IconName =
  | 'home' | 'menu' | 'card' | 'calendar' | 'user' | 'plus' | 'minus' | 'close' | 'chevron-right'
  | 'chevron-left' | 'bag' | 'search' | 'phone' | 'pin' | 'instagram' | 'message' | 'clock' | 'check'
  | 'gift' | 'table' | 'wallet' | 'wave' | 'cake' | 'info' | 'logout' | 'music' | 'receipt'
  | 'heart' | 'heart-filled' | 'repeat' | 'help';

const paths: Record<IconName, (c: ColorValue) => React.ReactNode> = {
  home: () => <Path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9" />,
  menu: () => <Path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0V5.5ZM12 5.5V19" />,
  card: () => (
    <>
      <Rect x="3" y="3" width="7" height="7" rx="1.5" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" />
      <Path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </>
  ),
  calendar: () => (
    <>
      <Rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  user: () => (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20.5c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  minus: () => <Path d="M5 12h14" />,
  close: () => <Path d="M6 6l12 12M18 6 6 18" />,
  'chevron-right': () => <Path d="m9 5 7 7-7 7" />,
  'chevron-left': () => <Path d="m15 5-7 7 7 7" />,
  bag: () => <Path d="M5 8h14l-1 12.5H6L5 8ZM9 8V6.5a3 3 0 0 1 6 0V8" />,
  search: () => (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="m16 16 4.5 4.5" />
    </>
  ),
  phone: () => (
    <Path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" />
  ),
  pin: () => (
    <>
      <Path d="M12 21s7-6 7-11.5a7 7 0 0 0-14 0C5 15 12 21 12 21Z" />
      <Circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  instagram: () => (
    <>
      <Rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <Circle cx="12" cy="12" r="4" />
      <Path d="M17.2 6.8h.01" />
    </>
  ),
  message: () => <Path d="M4 19.5 5.3 16A8 8 0 1 1 8 18.7L4 19.5Z" />,
  clock: () => (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7.5V12l3 2" />
    </>
  ),
  check: () => <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  gift: () => (
    <>
      <Rect x="4" y="9" width="16" height="11.5" rx="1.5" />
      <Path d="M3 9h18M12 9v11.5M12 9C10 5 6.5 5.5 7.5 7.5 8.2 9 12 9 12 9Zm0 0c2-4 5.5-3.5 4.5-1.5C15.8 9 12 9 12 9Z" />
    </>
  ),
  table: () => <Path d="M3 9h18M5 9l-1 11M19 9l1 11M8 9v6h8V9M12 4v5" />,
  wallet: () => (
    <>
      <Path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <Rect x="4" y="8" width="16.5" height="12" rx="2.5" />
      <Path d="M16.5 14h.01" />
    </>
  ),
  wave: () => <Path d="M2.5 9c2.5-2 4.5-2 7 0s4.5 2 7 0 3.5-1.5 5-1M2.5 15c2.5-2 4.5-2 7 0s4.5 2 7 0 3.5-1.5 5-1" />,
  cake: () => <Path d="M4 20.5h16M5 20.5V13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7.5M5 15.5c2.3 1.4 4.7 1.4 7 0 2.3 1.4 4.7 1.4 7 0M12 11V7.5M12 5a1 1 0 0 0 0-2" />,
  info: () => (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 11v5M12 8h.01" />
    </>
  ),
  logout: () => <Path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14M10 12h10M17 8.5l3.5 3.5-3.5 3.5" />,
  music: () => (
    <>
      <Path d="M9 18V6l11-2v12" />
      <Circle cx="6.5" cy="18" r="2.5" />
      <Circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  heart: () => <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  'heart-filled': (c) => <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill={c} />,
  repeat: () => <Path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20m-3-3 3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4m3 3-3-3 3-3" />,
  help: () => (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17h.01" />
    </>
  ),
  receipt: () => <Path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17ZM9 8h6M9 12h6M9 16h3" />,
};

/**
 * [sf-symbols] iOS'ta simgeler SF Symbols'tür: sistem fontuyla aynı ağırlıkta hizalanır,
 * Dynamic Type ve koyu modla uyumludur. [tab-bars] "Prefer filled symbols" → sekmelerde .fill.
 * [sf-symbols › Design variants] "The outline variant works well in toolbars, lists… alongside text"
 * → liste ve düğme içindeki simgeler outline.
 * SF Symbols lisansı yalnızca Apple platformlarında kullanıma izin verir; Android ve web'de aynı
 * anlamı taşıyan çizgi simgeler (aşağıdaki SVG'ler) gösterilir.
 * En düşük iOS 16.4 → yalnızca SF Symbols 4.0 ve öncesindeki simgeler seçildi.
 */
export const sfName: Record<IconName, SFSymbol> = {
  home: 'house',
  menu: 'menucard',
  card: 'qrcode',
  calendar: 'calendar',
  user: 'person.crop.circle',
  plus: 'plus',
  minus: 'minus',
  close: 'xmark',
  'chevron-right': 'chevron.right',
  'chevron-left': 'chevron.left',
  bag: 'bag',
  search: 'magnifyingglass',
  phone: 'phone',
  pin: 'mappin.and.ellipse',
  instagram: 'camera', // [sf-symbols] marka logoları SF Symbols'te yok; kullanılması da yasak
  message: 'message',
  clock: 'clock',
  check: 'checkmark',
  gift: 'gift',
  table: 'table.furniture',
  wallet: 'creditcard',
  wave: 'beach.umbrella',
  cake: 'birthday.cake',
  info: 'info.circle',
  logout: 'rectangle.portrait.and.arrow.right',
  music: 'music.note',
  receipt: 'doc.text',
  heart: 'heart',
  'heart-filled': 'heart.fill',
  repeat: 'arrow.clockwise',
  help: 'questionmark.circle',
};

export function Icon({
  name,
  size = 22,
  color = colors.label,
  strokeWidth = 1.6,
  weight = 'regular',
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
  /** [sf-symbols › Weights and scales] simge ağırlığı yanındaki metnin ağırlığıyla eşleşir. */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  const svg = (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name](color)}
    </Svg>
  );
  if (Platform.OS !== 'ios') return svg;
  return <SymbolView name={sfName[name]} size={size} tintColor={color} weight={weight} type="monochrome" fallback={svg} />;
}
