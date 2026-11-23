import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Chip, IconButton, Screen, Stepper, T } from '../components/ui';
import { restaurant } from '../config/restaurant';
import { translate, useT, type Lang } from '../i18n';
import { colors, font, radius, space } from '../theme';

const types = ['pasta', 'dogumgunu', 'dugun', 'kurumsal', 'baby', 'diger'] as const;

/**
 * Pasta & davet talebi. Şimdilik talebi WhatsApp mesajı olarak hazırlar;
 * backend geldiğinde POST /event-requests'e taşınmalı.
 */
export default function Events() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useT();
  const [type, setType] = useState<(typeof types)[number]>(types[0]);
  const [guests, setGuests] = useState(20);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const send = () => {
    // Mesaj misafirin dilinde; Türkçe değilse ekip için altına Türkçe özet eklenir
    const msg = (l: Lang) => translate(l, 'events.msg', { type: translate(l, `events.t.${type}`), date: date || '-', n: guests, note: note || '-' });
    const text = lang === 'tr' ? msg('tr') : `${msg(lang)}\n\n— TR —\n${msg('tr')}`;
    Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
  };

  return (
    <Screen padded={false} bottomInset={40} style={{ paddingTop: 0 }}>
      <View>
        <Image source={require('../../assets/images/terrace.jpg')} style={styles.hero} contentFit="cover" />
        <IconButton name="chevron-left" label={t('common.back')} overMedia onPress={() => router.back()} style={[styles.back, { top: insets.top + space.sm }]} />
      </View>
      <View style={{ padding: space.xl }}>
        <T v="label">{t('events.kicker')}</T>
        <T v="h1" style={{ marginTop: 6 }}>
          {t('events.title')}
        </T>
        <T style={{ marginTop: space.md }}>{t('events.body')}</T>

        <Card style={{ marginTop: space.xl }}>
          <T v="h3">{t('events.cakeTitle')}</T>
          <T style={{ marginTop: 4 }}>{t('events.cakeBody')}</T>
        </Card>

        <T v="label" style={{ marginTop: space.xl }}>
          {t('events.type')}
        </T>
        <View style={styles.wrap}>
          {types.map((x) => (
            <Chip key={x} label={t(`events.t.${x}`)} active={x === type} onPress={() => setType(x)} />
          ))}
        </View>

        <T v="label" style={{ marginTop: space.xl }}>
          {t('events.date')}
        </T>
        <TextInput value={date} onChangeText={setDate} placeholder={t('events.datePh')} placeholderTextColor={colors.placeholder} style={styles.input} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl }}>
          <T v="label">{t('events.guests')}</T>
          <Stepper value={guests} onChange={setGuests} min={1} />
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('events.notePh')}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: space.md }]}
          multiline
        />

        <Button title={t('events.send')} icon="message" onPress={send} style={{ marginTop: space.xl }} />
        <Button title={t('events.call')} icon="phone" variant="secondary" onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} style={{ marginTop: space.md }} />
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
    backgroundColor: colors.secondaryGroupedBackground,
    paddingHorizontal: space.lg,
    ...font.regular,
    fontSize: 15,
    color: colors.label,
  },
});
