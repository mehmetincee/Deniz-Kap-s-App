import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T } from '../components/ui';
import { requestOtp, verifyOtp } from '../services/auth';
import { useStore } from '../store';
import { colors, fonts, radius, space } from '../theme';

/** Karşılama + telefonla giriş (OTP). Demo kodu: 1971 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const signIn = useStore((s) => s.signIn);
  const [step, setStep] = useState<'intro' | 'phone' | 'code'>('intro');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const digits = phone.replace(/\D/g, '');

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
    if (!ok) return setError('Kod hatalı. Demo için 1971 yazabilirsiniz.');
    signIn(name.trim(), `+90${digits}`);
    router.replace('/');
  }

  if (step === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.seaDeep }}>
        <Image source={require('../../assets/images/hero-sea.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,24,48,0.45)' }]} />
        <View style={[styles.intro, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
          <Image source={require('../../assets/images/mark-white.png')} style={{ width: 72, height: 72 }} contentFit="contain" />
          <View style={{ flex: 1 }} />
          <Text style={styles.kicker}>İÇMELER · MARMARİS · 1971</Text>
          <Text style={styles.heroTitle}>Denizin kapısı,{'\n'}sofranın başı.</Text>
          <Text style={styles.heroBody}>
            Masanızdan sipariş verin, hesabı telefondan ödeyin, her ziyarette İnci biriktirin.
          </Text>
          <Button title="Başlayalım" variant="light" onPress={() => setStep('phone')} style={{ marginTop: space.xl }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.sand }}>
      <View style={{ flex: 1, padding: space.xl, paddingTop: insets.top + 32 }}>
        <Image source={require('../../assets/images/mark.png')} style={{ width: 48, height: 48 }} contentFit="contain" />
        {step === 'phone' ? (
          <>
            <T v="h1" style={{ marginTop: space.xl }}>
              Hoş geldiniz
            </T>
            <T style={{ marginTop: space.sm }}>Size nasıl hitap edelim? Telefon numaranız kartınız olacak.</T>
            <TextInput
              placeholder="Adınız"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoComplete="name"
              textContentType="givenName"
            />
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
              <Text style={styles.prefix}>+90</Text>
              <TextInput
                placeholder="5XX XXX XX XX"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={14}
                style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink, height: 54 }}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>
            <T v="small" style={{ marginTop: space.md }}>
              Devam ederek Üyelik Sözleşmesi'ni ve KVKK Aydınlatma Metni'ni kabul etmiş olursunuz.
            </T>
            <View style={{ flex: 1 }} />
            <Button title="Kod gönder" onPress={sendCode} loading={busy} disabled={name.trim().length < 2 || digits.length !== 10} />
          </>
        ) : (
          <>
            <T v="h1" style={{ marginTop: space.xl }}>
              Doğrulama kodu
            </T>
            <T style={{ marginTop: space.sm }}>+90 {phone} numarasına gönderdiğimiz 4 haneli kodu girin.</T>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="• • • •"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.code]}
              autoFocus
              textContentType="oneTimeCode"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button title="Numarayı değiştir" variant="ghost" onPress={() => setStep('phone')} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
            <View style={{ flex: 1 }} />
            <Button title="Doğrula ve başla" onPress={confirm} loading={busy} disabled={code.length !== 4} />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, paddingHorizontal: space.xl },
  kicker: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2.4, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: colors.white, marginTop: space.md },
  heroBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)', marginTop: space.md },
  input: {
    marginTop: space.lg,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  prefix: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink, marginRight: space.sm },
  code: { textAlign: 'center', fontSize: 26, letterSpacing: 14, fontFamily: fonts.bodySemi },
  error: { fontFamily: fonts.bodyMedium, color: colors.coral, marginTop: space.md },
});
