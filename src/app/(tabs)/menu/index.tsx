import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { CartBar } from '../../../components/CartBar';
import { Icon } from '../../../components/Icon';
import { ProductRow } from '../../../components/ProductRow';
import { Chip, T } from '../../../components/ui';
import { ordering } from '../../../config/restaurant';
import { currentServiceId, getProduct, isOrderableService, services, type Product } from '../../../data/menu';
import { useStore, type OrderMode } from '../../../store';
import { colors, font, radius, space, textStyle } from '../../../theme';

export default function Menu() {
  const params = useLocalSearchParams<{ mode?: OrderMode; service?: string }>();
  const setOrderContext = useStore((s) => s.setOrderContext);
  const favorites = useStore((s) => s.favorites);
  const table = useStore((s) => s.table);
  const orderMode = useStore((s) => s.orderMode);
  const [serviceId, setServiceId] = useState(params.service ?? currentServiceId());
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  const listRef = useRef<SectionList<Product>>(null);

  useEffect(() => {
    if (params.mode) setOrderContext({ orderMode: params.mode });
  }, [params.mode, setOrderContext]);

  const service = services.find((s) => s.id === serviceId)!;

  const sections = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const favSection = favorites.length
      ? [{ id: 'favoriler', title: 'Favorilerim', titleEn: undefined, items: favorites.map(getProduct).filter(Boolean) as Product[] }]
      : [];
    const source = q ? services.flatMap((s) => s.sections) : [...favSection, ...service.sections];
    return source
      .map((sec) => ({
        ...sec,
        data: q
          ? sec.items.filter((p) => `${p.name} ${p.nameEn ?? ''} ${p.description ?? ''}`.toLocaleLowerCase('tr-TR').includes(q))
          : sec.items,
      }))
      .filter((s) => s.data.length);
  }, [service, query, favorites]);

  const jump = (i: number) => {
    setActiveSection(i);
    listRef.current?.scrollToLocation({ sectionIndex: i, itemIndex: 0, viewOffset: 0, animated: true });
  };

  const orderable = isOrderableService(service.id);
  const nativeSearch = Platform.OS !== 'web';

  const servicePicker = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.services} style={{ marginHorizontal: -space.lg }}>
      {services.map((s) => (
        <Chip
          key={s.id}
          label={s.title}
          active={s.id === serviceId}
          onPress={() => {
            setServiceId(s.id);
            setActiveSection(0);
            listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewOffset: 0, animated: false });
          }}
        />
      ))}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          // [search-fields › iOS] "Search in a toolbar… top toolbar, also called a navigation bar"
          // [search-fields] "Use placeholder text to help people know what they can search for"
          headerSearchBarOptions: nativeSearch
            ? {
                placeholder: 'Karides, sarma, limonata…',
                hideWhenScrolling: false,
                onChangeText: (e) => setQuery(e.nativeEvent.text),
                onCancelButtonPress: () => setQuery(''),
              }
            : undefined,
          // Şezlong bilgisi gezinme çubuğunda, başlığın karşısında [toolbars › trailing edge]
          headerRight: () =>
            orderMode === 'masa' && table ? (
              <Text style={styles.tableBadge} accessibilityLabel={`${ordering.areaName} ${table} için sipariş`}>
                {ordering.areaName} {table}
              </Text>
            ) : null,
        }}
      />
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(p) => p.id}
        // [lists-and-tables] menü düz (plain) liste: metin taranması kolay satırlar
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 140 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader} accessibilityRole="header">
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {!!section.titleEn && <Text style={styles.sectionEn}>{section.titleEn}</Text>}
          </View>
        )}
        renderItem={({ item }) => <ProductRow product={item} />}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems.find((v) => v.section);
          const idx = first ? sections.findIndex((s) => s.id === (first.section as { id: string }).id) : -1;
          if (idx >= 0 && idx !== activeSection) setActiveSection(idx);
        }}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={{ paddingTop: space.sm }}>
            {!nativeSearch && (
              <View style={styles.search}>
                <Icon name="search" size={16} color={colors.secondaryLabel} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Karides, sarma, limonata…"
                  placeholderTextColor={colors.placeholder}
                  style={styles.searchInput}
                  returnKeyType="search"
                  accessibilityLabel="Menüde ara"
                />
              </View>
            )}
            {!query && (
              <>
                {servicePicker}
                <Text style={styles.serviceHours}>
                  {service.title} · {service.hours}
                </Text>
                {/* [color › Inclusive color] durum simge + metinle anlatılır, yalnızca renkle değil */}
                <View style={styles.pilot}>
                  <Icon name={orderable ? 'wave' : 'info'} size={18} color={orderable ? colors.teal : colors.secondaryLabel} />
                  <Text style={styles.pilotText}>
                    {orderable
                      ? `${ordering.areaName}dan sipariş açık (${ordering.hours.from}–${ordering.hours.to}). Ödeme hesapta.`
                      : `Bu menü bilgi amaçlı. ${ordering.areaName}dan şimdilik öğle menüsü ve içecekler sipariş edilebiliyor.`}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsNav} style={{ marginHorizontal: -space.lg }}>
                  {sections.map((s, i) => (
                    <Text
                      key={s.id}
                      accessibilityRole="button"
                      onPress={() => jump(i)}
                      style={[styles.sectionLink, i === activeSection && styles.sectionLinkActive]}
                    >
                      {s.title}
                    </Text>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          <T v="small" style={styles.footer}>
            Alerjen bilgisi için ürün detayına bakabilir ya da ekibimize danışabilirsiniz. Alkollü içecekler mevzuat gereği uygulama
            üzerinden satılmaz; şarap, rakı ve kokteyl listemiz için garsonunuzdan bilgi alabilirsiniz.
          </T>
        }
        ListEmptyComponent={<T style={{ marginTop: space.xl, color: colors.secondaryLabel }}>“{query}” için sonuç bulunamadı.</T>}
      />
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  tableBadge: {
    ...font.semibold,
    ...textStyle.footnote,
    color: colors.onAccent,
    backgroundColor: colors.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  // Web: iOS arama alanı görünümü (gri dolgulu, büyüteç simgeli) [search-fields]
  search: {
    marginBottom: space.md,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.fill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    gap: 6,
  },
  searchInput: { flex: 1, ...font.regular, ...textStyle.body, color: colors.label, height: 36 },
  services: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: 5 },
  sectionsNav: { gap: space.xl, paddingHorizontal: space.lg, paddingTop: space.md },
  sectionLink: { ...font.medium, ...textStyle.subhead, color: colors.secondaryLabel, paddingVertical: space.sm },
  sectionLinkActive: { color: colors.accent, ...font.semibold },
  pilot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
  },
  pilotText: { flex: 1, ...font.regular, ...textStyle.footnote, color: colors.label },
  serviceHours: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel, marginTop: space.sm },
  sectionHeader: { paddingTop: space.xxl, paddingBottom: space.xs },
  sectionTitle: { ...font.serifBold, ...textStyle.title2, color: colors.label },
  sectionEn: { ...font.serifItalic, ...textStyle.subhead, color: colors.secondaryLabel },
  footer: { marginTop: space.xl },
});
