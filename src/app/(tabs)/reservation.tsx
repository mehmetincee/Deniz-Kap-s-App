import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, SectionTitle, Screen, Stepper, T, tap } from '../../components/ui';
import { restaurant } from '../../config/restaurant';
import { useNow } from '../../hooks/useNow';
import { useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

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
    <Screen bottomInset={40}>
      <T v="hero">Rezervasyon</T>
      <T style={{ marginTop: space.sm }}>Gün batımına karşı bir masa ayıralım. Talebiniz müsaitliğe göre onaylanır.</T>

      {sent && (
        <Card style={styles.success}>
          <T v="h3" style={{ color: colors.white }}>
            Talebiniz alındı
          </T>
          <T style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Ekibimiz kısa süre içinde SMS ile onay gönderecek.</T>
        </Card>
      )}

      <View style={{ marginTop: space.xl }}>
        <T v="label">Tarih</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }} contentContainerStyle={styles.days}>
          {days.map((d, i) => {
            const active = d.getTime() === day.getTime();
            return (
              <Pressable key={d.toISOString()} onPress={() => (tap(), setDay(d))} style={[styles.day, active && styles.dayActive]}>
                <Text style={[styles.dayName, active && { color: '#BFE0F5' }]}>
                  {i === 0 ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayNum, active && { color: colors.white }]}>{d.getDate()}</Text>
                <Text style={[styles.dayName, active && { color: '#BFE0F5' }]}>{d.toLocaleDateString('tr-TR', { month: 'short' })}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ marginTop: space.lg }}>
        <T v="label">Saat</T>
        <View style={styles.wrap}>
          {available.map((t) => (
            <Chip key={t} label={t} active={t === selectedTime} onPress={() => setTime(t)} />
          ))}
          {available.length === 0 && <T>Bugün için boş saat kalmadı, lütfen başka bir gün seçin.</T>}
        </View>
      </View>

      <View style={[styles.rowBetween, { marginTop: space.xl }]}>
        <View>
          <T v="label">Kişi sayısı</T>
          <T v="small">8+ kişi için Davet sayfasını kullanın</T>
        </View>
        <Stepper value={guests} onChange={(n) => setGuests(Math.min(8, n))} min={1} />
      </View>

      <View style={{ marginTop: space.xl }}>
        <T v="label">Alan tercihi</T>
        <View style={styles.wrap}>
          {areas.map((a) => (
            <Chip key={a} label={a} active={a === area} onPress={() => setArea(a)} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: space.xl }}>
        <T v="label">Özel bir gün mü?</T>
        <View style={styles.wrap}>
          {occasions.map((o) => (
            <Chip key={o} label={o} active={o === occasion} onPress={() => setOccasion(o === occasion ? undefined : o)} />
          ))}
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Notunuz (alerji, mama sandalyesi, sürpriz pasta…)"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
      </View>

      <Button
        title={
          selectedTime
            ? `${day.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · ${selectedTime} · ${guests} kişi`
            : 'Saat seçin'
        }
        disabled={!selectedTime}
        onPress={submit}
        style={{ marginTop: space.xl }}
      />
      <T v="small" style={{ textAlign: 'center', marginTop: space.sm }}>
        Acil durumlar için {restaurant.phoneLabel}
      </T>

      {upcoming.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <SectionTitle title="Rezervasyonlarım" />
          {upcoming.map((r) => (
            <Card key={r.id} style={{ marginBottom: space.md }}>
              <View style={styles.rowBetween}>
                <Text style={styles.resTitle}>
                  {new Date(r.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {r.time}
                </Text>
              </View>
              <T v="small" style={{ marginTop: 4 }}>
                {r.guests} kişi · {r.area}
                {r.occasion ? ` · ${r.occasion}` : ''} · {r.status === 'beklemede' ? 'Onay bekliyor' : 'Onaylandı'}
              </T>
              <Button title="İptal et" variant="ghost" onPress={() => cancelReservation(r.id)} style={{ alignSelf: 'flex-start', paddingHorizontal: 0, height: 40 }} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  success: { marginTop: space.lg, backgroundColor: colors.success },
  days: { gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.sm },
  day: {
    width: 64,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  dayActive: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  dayName: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted, textTransform: 'capitalize' },
  dayNum: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginVertical: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    marginTop: space.md,
    minHeight: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  resTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, textTransform: 'capitalize' },
});
