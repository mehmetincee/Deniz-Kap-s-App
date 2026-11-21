import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartBar } from '../../components/CartBar';
import { Icon } from '../../components/Icon';
import { ProductRow } from '../../components/ProductRow';
import { Chip, T } from '../../components/ui';
import { currentServiceId, getProduct, services, type Product } from '../../data/menu';
import { useStore, type OrderMode } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

export default function Menu() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: OrderMode }>();
  const setOrderContext = useStore((s) => s.setOrderContext);
  const favorites = useStore((s) => s.favorites);
  const table = useStore((s) => s.table);
  const orderMode = useStore((s) => s.orderMode);
  const [serviceId, setServiceId] = useState(currentServiceId());
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
    listRef.current?.scrollToLocation({ sectionIndex: i, itemIndex: 0, viewOffset: 60, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand }}>
      <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <T v="hero">Menü</T>
          {orderMode === 'masa' && !!table && <Text style={styles.tableBadge}>Masa {table}</Text>}
        </View>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Lezzet ara: karides, sarma, limonata…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      {!query && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.services} style={{ flexGrow: 0, flexShrink: 0 }}>
            {services.map((s) => (
              <Chip
                key={s.id}
                label={s.title}
                active={s.id === serviceId}
                onPress={() => {
                  setServiceId(s.id);
                  setActiveSection(0);
                  listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewOffset: 60, animated: false });
                }}
              />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsNav} style={{ flexGrow: 0, flexShrink: 0 }}>
            {sections.map((s, i) => (
              <Text key={s.id} onPress={() => jump(i)} style={[styles.sectionLink, i === activeSection && styles.sectionLinkActive]}>
                {s.title}
              </Text>
            ))}
          </ScrollView>
        </>
      )}

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(p) => p.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 120 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
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
          !query ? (
            <Text style={styles.serviceHours}>
              {service.title} · {service.hours}
            </Text>
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <T v="small">
              Alerjen bilgisi için ürün detayına bakabilir ya da ekibimize danışabilirsiniz. Alkollü içecekler mevzuat gereği
              uygulama üzerinden satılmaz; şarap, rakı ve kokteyl listemiz için garsonunuzdan bilgi alabilirsiniz.
            </T>
          </View>
        }
        ListEmptyComponent={<T style={{ marginTop: space.xl }}>“{query}” için sonuç bulunamadı.</T>}
      />
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  tableBadge: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.sea,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 6,
  },
  search: {
    marginTop: space.lg,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, height: 46 },
  services: { gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.lg },
  sectionsNav: { gap: space.xl, paddingHorizontal: space.xl, paddingVertical: space.md },
  sectionLink: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, paddingVertical: 6 },
  sectionLinkActive: { color: colors.seaDeep, fontFamily: fonts.bodySemi, borderBottomWidth: 2, borderBottomColor: colors.seaDeep },
  serviceHours: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, marginTop: space.xs },
  sectionHeader: { paddingTop: space.xl, paddingBottom: space.xs },
  sectionTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  sectionEn: { fontFamily: fonts.displayItalic, fontSize: 15, color: colors.muted },
  footer: { marginTop: space.xl, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.sandDeep },
});
