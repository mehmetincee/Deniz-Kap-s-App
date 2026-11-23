import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ListSection, Material, T, tap } from '../components/ui';
import { dayMonth, languages, useT } from '../i18n';
import { requestOtp, verifyOtp } from '../services/auth';
import { useStore } from '../store';
import { colors, font, radius, space, textStyle } from '../theme';

/** Ay başına gün sayısı (doğum günü için artık yıl dikkate alınır: 29 Şubat geçerli). */
const daysIn = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Karşılama + kayıt (ad, telefon, isteğe bağlı doğum günü) + SMS kodu. Demo kodu: 1971.
 * Doğum gününde yalnızca gün ve ay istenir (yıl gerekmez → KVKK veri en aza indirme).
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useT();
  const setLang = useStore((s) => s.setLang);
  const signIn = useStore((s) => s.signIn);
  const [step, setStep] = useState<'intro' | 'phone' | 'code'>('intro');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // "0532…", "+90 532…" ve "532…" biçimlerinin hepsini 10 haneye indir
  const digits = phone.replace(/\D/g, '').replace(/^(90|0)(?=5\d{9}$)/, '');
  const d = Number(day);
  const m = Number(month);
  const birthdayValid = m >= 1 && m <= 12 && d >= 1 && d <= daysIn[m - 1];
  const birthdayEmpty = !day && !month;

  async function sendCode() {
    setBusy(true);
    setError('');
    await requestOtp(digits);
    setBusy(false);
    setStep('code');
  }

  async function confirm() {
    setBusy(true);
    const ok = await verifyOtp(digits, code);
    setBusy(false);
    if (!ok) return setError(t('code.error'));
    signIn(name.trim(), `+90${digits}`, birthdayValid ? { day: d, month: m } : undefined);
    router.replace('/');
  }

  // Dil seçimi: ilk ekranda, uygulamanın her yerinde geçerli
  const langPicker = (
    <View style={styles.langs} accessibilityRole="tablist">
      {languages.map((l) => (
        <Pressable
          key={l}
          accessibilityRole="tab"
          accessibilityState={{ selected: l === lang }}
          accessibilityLabel={t(`lang.${l}`)}
          hitSlop={6}
          onPress={() => (tap(), setLang(l))}
          style={[styles.lang, l === lang && styles.langActive]}
        >
          <Text style={[styles.langText, l === lang && { color: colors.label }]}>{l.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );

  if (step === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1730' }}>
        <Image source={require('../../assets/images/hero-sea.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        {/* [materials] parlak fotoğraf üstündeki metin için karartma */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.38)' }]} />
        <View style={[styles.intro, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + 32 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Image source={require('../../assets/images/mark-white.png')} style={{ width: 64, height: 64 }} contentFit="contain" />
            <View style={{ borderRadius: radius.pill, overflow: 'hidden' }}>
              <Material variant="clear" style={StyleSheet.absoluteFill} />
              {langPicker}
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.kicker}>{t('welcome.kicker')}</Text>
          <Text style={styles.heroTitle}>{t('welcome.title')}</Text>
          <Text style={styles.heroBody}>{t('welcome.body')}</Text>
          <Button title={t('welcome.start')} variant="light" onPress={() => setStep('phone')} style={{ marginTop: space.xl }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/images/mark.png')} style={{ width: 48, height: 48 }} contentFit="contain" />
        {step === 'phone' ? (
          <>
            <T v="h1" style={{ marginTop: space.lg }}>
              {t('signup.title')}
            </T>
            <T v="secondary" style={{ marginTop: space.sm }}>
              {t('signup.body')}
            </T>
            <ListSection>
              <TextInput
                placeholder={t('signup.name')}
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                style={styles.input}
                autoComplete="name"
                textContentType="givenName"
                accessibilityLabel={t('signup.name')}
              />
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={styles.prefix}>+90</Text>
                <TextInput
                  placeholder={t('signup.phone')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={17}
                  style={styles.inlineInput}
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  accessibilityLabel={t('signup.phone')}
                />
              </View>
            </ListSection>

            <ListSection header={t('signup.birthday')} footer={t('signup.birthdayHint')}>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: space.md }]}>
                <TextInput
                  value={day}
                  onChangeText={(v) => setDay(v.replace(/\D/g, '').slice(0, 2))}
                  placeholder={t('signup.day')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  style={[styles.inlineInput, styles.dateField]}
                  accessibilityLabel={t('signup.day')}
                />
                <Text style={styles.prefix}>/</Text>
                <TextInput
                  value={month}
                  onChangeText={(v) => setMonth(v.replace(/\D/g, '').slice(0, 2))}
                  placeholder={t('signup.month')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  style={[styles.inlineInput, styles.dateField]}
                  accessibilityLabel={t('signup.month')}
                />
                <Text style={[styles.preview, !birthdayValid && { color: colors.tertiaryLabel }]}>
                  {birthdayValid ? dayMonth(lang, d, m) : ''}
                </Text>
              </View>
            </ListSection>

            <T v="small" style={{ marginTop: space.lg, marginHorizontal: space.sm }}>
              {t('signup.consent')}
            </T>
            <View style={{ flex: 1, minHeight: space.xl }} />
            <Button
              title={t('signup.sendCode')}
              onPress={sendCode}
              loading={busy}
              disabled={name.trim().length < 2 || digits.length !== 10 || (!birthdayEmpty && !birthdayValid)}
            />
          </>
        ) : (
          <>
            <T v="h1" style={{ marginTop: space.lg }}>
              {t('code.title')}
            </T>
            <T v="secondary" style={{ marginTop: space.sm }}>
              {t('code.body', { phone: digits })}
            </T>
            <ListSection>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="• • • •"
                placeholderTextColor={colors.placeholder}
                style={[styles.input, styles.code]}
                autoFocus
                textContentType="oneTimeCode"
                accessibilityLabel={t('code.title')}
              />
            </ListSection>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button title={t('code.change')} variant="ghost" onPress={() => setStep('phone')} style={{ alignSelf: 'flex-start', marginTop: space.sm }} />
            <View style={{ flex: 1, minHeight: space.xl }} />
            <Button title={t('code.verify')} onPress={confirm} loading={busy} disabled={code.length !== 4} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, paddingHorizontal: space.xl },
  langs: { flexDirection: 'row', padding: 3, gap: 2 },
  lang: { minWidth: 40, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  langActive: { backgroundColor: '#FFFFFF' },
  langText: { ...font.semibold, ...textStyle.footnote, color: '#FFFFFF' },
  kicker: { ...font.semibold, ...textStyle.footnote, color: 'rgba(255,255,255,0.85)' },
  heroTitle: { ...font.serifBold, ...textStyle.largeTitle, color: '#FFFFFF', marginTop: space.sm },
  heroBody: { ...font.regular, ...textStyle.callout, color: 'rgba(255,255,255,0.9)', marginTop: space.md },
  input: { minHeight: 50, paddingHorizontal: space.lg, ...font.regular, ...textStyle.body, color: colors.label },
  inlineInput: { flex: 1, minHeight: 50, ...font.regular, ...textStyle.body, color: colors.label },
  dateField: { flex: 0, width: 56, textAlign: 'center' },
  preview: { flex: 1, textAlign: 'right', ...font.regular, ...textStyle.body, color: colors.secondaryLabel },
  prefix: { ...font.regular, ...textStyle.body, color: colors.secondaryLabel, marginRight: space.sm },
  code: { textAlign: 'center', ...font.semibold, fontSize: 28, letterSpacing: 14 },
  error: { ...font.regular, ...textStyle.footnote, color: colors.red, marginTop: space.md, marginHorizontal: space.sm },
});
