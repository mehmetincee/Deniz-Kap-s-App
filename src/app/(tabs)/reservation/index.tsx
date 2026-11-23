import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, ListSection, Row, Screen, Stepper, T, tap } from '../../../components/ui';
import { restaurant } from '../../../config/restaurant';
import { useNow } from '../../../hooks/useNow';
import { translate, useT, type Lang, type StringKey } from '../../../i18n';
import { useStore } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

// Değerler kimlik olarak saklanır, ekranda seçili dilde gösterilir
const areas = ['deniz', 'teras', 'bahce', 'ic'] as const;
const occasions = ['dogumgunu', 'yildonumu', 'is', 'teklif'] as const;
const times = ['09:00', '10:00', '11:00', '12:30', '13:30', '17:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

function nextDays(n = 14) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Rezervasyon talebi.
 * Sunucu olmadığı için talep WhatsApp mesajı olarak restoran hattına gider (mesaj misafirin dilinde;
 * Türkçe değilse ekibin okuması için altına Türkçe özeti eklenir). Talep ayrıca "Rezervasyonlarım"da tutulur.
 */
export default function Reservation() {
  const { t, lang, locale } = useT();
  const { reservations, addReservation, cancelReservation, user } = useStore();
  const days = useMemo(() => nextDays(), []);
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState(2);
  const [area, setArea] = useState<(typeof areas)[number]>('deniz');
  const [occasion, setOccasion] = useState<(typeof occasions)[number] | undefined>();
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const now = useNow();
  const isPast = (d: Date, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const at = new Date(d);
    at.setHours(h, m, 0, 0);
    // En az 1 saat sonrası için rezervasyon alınır
    return at.getTime() < now + 60 * 60 * 1000;
  };
  const available = times.filter((x) => !isPast(day, x));
  const selectedTime = available.includes(time) ? time : available[0];
  const upcoming = reservations.filter((r) => r.status !== 'iptal' && !isPast(new Date(r.date), r.time));

  const areaLabel = (id: string, l: Lang = lang) => translate(l, `res.area.${id}` as StringKey);
  const occLabel = (id: string | undefined, l: Lang = lang) => (id ? translate(l, `res.occ.${id}` as StringKey) : '-');
  const dateLabel = (d: Date, loc = locale) => d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });

  const message = (l: Lang) =>
    translate(l, 'res.msg', {
      name: user?.name ?? '-',
      phone: user?.phone ?? '-',
      date: dateLabel(day, l === 'tr' ? 'tr-TR' : l === 'ru' ? 'ru-RU' : 'en-GB'),
      time: selectedTime ?? '-',
      n: guests,
      area: areaLabel(area, l),
      occasion: occLabel(occasion, l),
      note: note.trim() || '-',
    });

  const submit = () => {
    if (!selectedTime) return;
    const text = lang === 'tr' ? message('tr') : `${message(lang)}\n\n— TR —\n${message('tr')}`;
    Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
    addReservation({ date: day.toISOString(), time: selectedTime, guests, area, occasion, note: note.trim() || undefined });
    setSent(true);
    setNote('');
    setOccasion(undefined);
  };

  const cancel = (r: (typeof reservations)[number]) => {
    const d = new Date(r.date);
    const msg = translate('tr', 'res.cancelMsg', { date: dateLabel(d, 'tr-TR'), time: r.time, n: r.guests, name: user?.name ?? '-' });
    Linking.openURL(`${restaurant.whatsapp}?text=${encodeURIComponent(msg)}`);
    cancelReservation(r.id);
  };

  return (
    <Screen>
      <T v="secondary" style={{ marginHorizontal: space.xs }}>
        {t('res.intro')}
      </T>

      {sent && (
        // [color › Inclusive color] durum simge + metinle verilir
        <ListSection>
          <Row icon="check" iconColor={colors.green} title={t('res.sentTitle')} subtitle={t('res.sentBody')} />
        </ListSection>
      )}

      <Text style={styles.header}>{t('res.date')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={styles.days}>
        {days.map((d, i) => {
          const active = d.getTime() === day.getTime();
          const fg = active ? colors.onAccent : colors.label;
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={dateLabel(d)}
              onPress={() => (tap(), setDay(d))}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.dayName, { color: fg }]}>{i === 0 ? t('res.today') : d.toLocaleDateString(locale, { weekday: 'short' })}</Text>
              <Text style={[styles.dayNum, { color: fg }]}>{d.getDate()}</Text>
              <Text style={[styles.dayName, { color: fg }]}>{d.toLocaleDateString(locale, { month: 'short' })}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.header}>{t('res.time')}</Text>
      <View style={styles.wrap}>
        {available.map((x) => (
          <Chip key={x} label={x} active={x === selectedTime} onPress={() => setTime(x)} />
        ))}
        {available.length === 0 && <T v="secondary">{t('res.noSlots')}</T>}
      </View>

      <ListSection footer={t('res.guestsFooter')}>
        <Row title={t('res.guests')} right={<Stepper small value={guests} onChange={(n) => setGuests(Math.min(8, n))} min={1} />} />
      </ListSection>

      <Text style={styles.header}>{t('res.area')}</Text>
      <View style={styles.wrap}>
        {areas.map((a) => (
          <Chip key={a} label={areaLabel(a)} active={a === area} onPress={() => setArea(a)} />
        ))}
      </View>

      <Text style={styles.header}>{t('res.occasion')}</Text>
      <View style={styles.wrap}>
        {occasions.map((o) => (
          <Chip key={o} label={occLabel(o)} active={o === occasion} onPress={() => setOccasion(o === occasion ? undefined : o)} />
        ))}
      </View>

      <ListSection header={t('res.note')}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('res.notePh')}
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          multiline
          accessibilityLabel={t('res.note')}
        />
      </ListSection>

      {/* [buttons] görünümdeki tek belirgin düğme; etiket seçimi özetler */}
      <Button
        title={selectedTime ? t('res.submit', { date: day.toLocaleDateString(locale, { day: 'numeric', month: 'long' }), time: selectedTime, n: guests }) : t('res.pickTime')}
        icon="message"
        disabled={!selectedTime}
        onPress={submit}
        style={{ marginTop: space.xl }}
      />
      <T v="small" style={{ textAlign: 'center', marginTop: space.sm }}>
        {t('res.emergency', { phone: restaurant.phoneLabel })}
      </T>

      {upcoming.length > 0 && (
        <ListSection header={t('res.mine')}>
          {upcoming.map((r) => (
            <Row
              key={r.id}
              icon="calendar"
              iconColor={colors.red}
              title={`${new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'long' })} · ${r.time}`}
              subtitle={`${t('res.guestsN', { n: r.guests })} · ${areaLabel(r.area)}${r.occasion ? ` · ${occLabel(r.occasion)}` : ''} · ${t('res.pending')}`}
              // [buttons] yıkıcı eylem; iptal de restorana WhatsApp ile bildirilir
              right={<Button title={t('res.cancel')} variant="ghost" onPress={() => cancel(r)} style={styles.cancel} />}
            />
          ))}
        </ListSection>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginHorizontal: space.lg, marginTop: space.xl, marginBottom: 7 },
  days: { gap: space.sm, paddingHorizontal: space.lg },
  day: { width: 58, paddingVertical: space.sm + 2, borderRadius: radius.md, backgroundColor: colors.secondaryGroupedBackground, alignItems: 'center' },
  dayActive: { backgroundColor: colors.accent },
  dayName: { ...font.medium, ...textStyle.caption1, textTransform: 'capitalize' },
  dayNum: { ...font.semibold, ...textStyle.title2, marginVertical: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: { minHeight: 88, padding: space.lg, ...font.regular, ...textStyle.body, color: colors.label, textAlignVertical: 'top' },
  cancel: { minHeight: 44, paddingHorizontal: space.sm },
});
