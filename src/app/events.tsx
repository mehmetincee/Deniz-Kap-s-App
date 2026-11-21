import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Chip, IconButton, Screen, Stepper, T } from '../components/ui';
import { restaurant } from '../config/restaurant';
import { colors, fonts, radius, space } from '../theme';

const types = ['Pasta siparişi', 'Doğum günü', 'Düğün / nişan', 'Kurumsal etkinlik', 'Baby shower', 'Diğer'];

/**
 * Pasta & davet talebi. Şimdilik talebi WhatsApp mesajı olarak hazırlar;
 * backend geldiğinde POST /event-requests'e taşınmalı.
 */
export default function Events() {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState(types[0]);
  const [guests, setGuests] = useState(20);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const send = () => {
    const text = `Merhaba, Deniz Kapısı uygulamasından yazıyorum.\nTalep: ${type}\nTarih: ${date || '-'}\nKişi: ${guests}\nNot: ${note || '-'}`;
    Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
  };

  return (
    <Screen padded={false} bottomInset={40} style={{ paddingTop: 0 }}>
      <View>
        <Image source={require('../../assets/images/terrace.jpg')} style={styles.hero} contentFit="cover" />
        <IconButton name="chevron-left" label="Geri" onPress={() => router.back()} style={[styles.back, { top: insets.top + space.sm }]} />
      </View>
      <View style={{ padding: space.xl }}>
        <T v="label">Etkinlikler & Özel Davetler</T>
        <T v="h1" style={{ marginTop: 6 }}>
          Özel günleriniz, denizin kapısında.
        </T>
        <T style={{ marginTop: space.md }}>
          Doğum günü, nişan, düğün, kurumsal yemek ya da butik bir kutlama… Ses sistemi, DJ, canlı müzik, dekorasyon ve sahne
          desteğiyle davetinizi birlikte planlayalım.
        </T>

        <Card style={{ marginTop: space.xl, backgroundColor: colors.foam }}>
          <T v="h3">Pasta siparişi</T>
          <T style={{ marginTop: 4 }}>Etkinlik tarihinden en az 1 gün önce, saat 11:00’e kadar sipariş vermeniz yeterli.</T>
        </Card>

        <T v="label" style={{ marginTop: space.xl }}>
          Talep türü
        </T>
        <View style={styles.wrap}>
          {types.map((t) => (
            <Chip key={t} label={t} active={t === type} onPress={() => setType(t)} />
          ))}
        </View>

        <T v="label" style={{ marginTop: space.xl }}>
          Tarih
        </T>
        <TextInput value={date} onChangeText={setDate} placeholder="Ör. 14 Haziran, akşam" placeholderTextColor={colors.muted} style={styles.input} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl }}>
          <T v="label">Kişi sayısı</T>
          <Stepper value={guests} onChange={setGuests} min={1} />
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Pasta tercihi, menü, dekor fikirleri…"
          placeholderTextColor={colors.muted}
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: space.md }]}
          multiline
        />

        <Button title="WhatsApp ile gönder" icon="message" onPress={send} style={{ marginTop: space.xl }} />
        <Button title="Ara" icon="phone" variant="secondary" onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} style={{ marginTop: space.md }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 260 },
  back: { position: 'absolute', left: space.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  input: {
    marginTop: space.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
});
