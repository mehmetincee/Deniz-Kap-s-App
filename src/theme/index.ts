/**
 * Deniz Kapısı tasarım sistemi.
 * Renkler marka sitesinden (denizkapisi.com.tr / dkmenu.com.tr) türetildi:
 * kum zemin, logo mavisi, menüdeki indigo ve sıcak kahve tonu.
 */
export const colors = {
  sand: '#F5EFE4',
  sandDeep: '#ECE1CB',
  surface: '#FFFDF9',
  ink: '#1A2233',
  inkSoft: '#5B4942',
  muted: '#8A7F75',
  line: '#E6DCCB',
  sea: '#1F3A8A',
  seaDeep: '#14224F',
  sky: '#1E9BD7',
  foam: '#E3EEF8',
  coral: '#D2553B',
  olive: '#6E7B4B',
  success: '#2F7D5B',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'EBGaramond_500Medium',
  displayItalic: 'EBGaramond_400Regular_Italic',
  displayBold: 'EBGaramond_600SemiBold',
  body: 'Montserrat_400Regular',
  bodyMedium: 'Montserrat_500Medium',
  bodySemi: 'Montserrat_600SemiBold',
  bodyBold: 'Montserrat_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  h3: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  price: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
} as const;

export const shadow = {
  card: {
    shadowColor: '#2B1E12',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;
