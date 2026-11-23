import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, ListSection, Row, Screen, Stepper, T, tap } from '../../../components/ui';
import { restaurant } from '../../../config/restaurant';
import { useNow } from '../../../hooks/useNow';
import { useStore } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

const areas = ['Deniz kenarı', 'Teras', 'Bahçe', 'İç mekan'];
const occasions = ['Doğum günü', 'Yıldönümü', 'İş yemeği', 'Evlilik teklifi'];
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

export default function Reservation() {
  const { reservations, addReservation, cancelReservation } = useStore();
  const days = useMemo(() => nextDays(), []);
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState(2);
  const [area, setArea] = useState(areas[0]);
  const [occasion, setOccasion] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const now = useNow();
  const isPast = (d: Date, t: string) => {
    const [h, m] = t.split(':').map(Number);
    const at = new Date(d);
    at.setHours(h, m, 0, 0);
    // En az 1 saat sonrası için rezervasyon alınır
    return at.getTime() < now + 60 * 60 * 1000;
  };
  const available = times.filter((t) => !isPast(day, t));
  const selectedTime = available.includes(time) ? time : available[0];
  const upcoming = reservations.filter((r) => r.status !== 'iptal' && !isPast(new Date(r.date), r.time));

  const submit = () => {
    if (!selectedTime) return;
    addReservation({
      date: day.toISOString(),
      time: selectedTime,
      guests,
      area,
      occasion,
      note: note.trim() || undefined,
    });
    setSent(true);
    setNote('');
    setOccasion(undefined);
  };

  return (
    <Screen>
      <T v="secondary" style={{ marginHorizontal: space.xs }}>
        Gün batımına karşı bir masa ayıralım. Talebiniz müsaitliğe göre onaylanır.
      </T>

      {sent && (
        // [color › Inclusive color] onay simge + metinle verilir
        <ListSection>
          <Row icon="check" iconColor={colors.green} title="Talebiniz alındı" subtitle="Ekibimiz kısa süre içinde SMS ile onay gönderecek." />
        </ListSection>
      )}

      <Text style={styles.header}>Tarih</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={styles.days}>
        {days.map((d, i) => {
          const active = d.getTime() === day.getTime();
          const fg = active ? colors.onAccent : colors.label;
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              onPress={() => (tap(), setDay(d))}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.dayName, { color: fg }]}>{i === 0 ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'short' })}</Text>
              <Text style={[styles.dayNum, { color: fg }]}>{d.getDate()}</Text>
              <Text style={[styles.dayName, { color: fg }]}>{d.toLocaleDateString('tr-TR', { month: 'short' })}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.header}>Saat</Text>
      <View style={styles.wrap}>
        {available.map((t) => (
          <Chip key={t} label={t} active={t === selectedTime} onPress={() => setTime(t)} />
        ))}
        {available.length === 0 && <T v="secondary">Bugün için boş saat kalmadı, lütfen başka bir gün seçin.</T>}
      </View>

      <ListSection footer="8 kişiden kalabalık gruplar için Pasta & Davet sayfasını kullanın.">
        <Row title="Kişi sayısı" right={<Stepper small value={guests} onChange={(n) => setGuests(Math.min(8, n))} min={1} />} />
      </ListSection>

      <Text style={styles.header}>Alan tercihi</Text>
      <View style={styles.wrap}>
        {areas.map((a) => (
          <Chip key={a} label={a} active={a === area} onPress={() => setArea(a)} />
        ))}
      </View>

      <Text style={styles.header}>Özel bir gün mü?</Text>
      <View style={styles.wrap}>
        {occasions.map((o) => (
          <Chip key={o} label={o} active={o === occasion} onPress={() => setOccasion(o === occasion ? undefined : o)} />
        ))}
      </View>

      <ListSection header="Not">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Alerji, mama sandalyesi, sürpriz pasta…"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          multiline
          accessibilityLabel="Rezervasyon notu"
        />
      </ListSection>

      {/* [buttons] görünümdeki tek belirgin düğme; etiket seçimi özetler */}
      <Button
        title={selectedTime ? `${day.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${selectedTime} · ${guests} kişi` : 'Saat seçin'}
        disabled={!selectedTime}
        onPress={submit}
        style={{ marginTop: space.xl }}
      />
      <T v="small" style={{ textAlign: 'center', marginTop: space.sm }}>
        Acil durumlar için {restaurant.phoneLabel}
      </T>

      {upcoming.length > 0 && (
        <ListSection header="Rezervasyonlarım">
          {upcoming.map((r) => (
            <Row
              key={r.id}
              icon="calendar"
              iconColor={colors.red}
              title={`${new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${r.time}`}
              subtitle={`${r.guests} kişi · ${r.area}${r.occasion ? ` · ${r.occasion}` : ''} · ${r.status === 'beklemede' ? 'Onay bekliyor' : 'Onaylandı'}`}
              // [buttons] yıkıcı eylem systemRed, belirgin (prominent) değil
              right={<Button title="İptal" variant="ghost" onPress={() => cancelReservation(r.id)} style={styles.cancel} />}
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
