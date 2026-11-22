import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useStore } from '../../store';

/**
 * Masa / şezlong QR'ı: denizkapisi://masa/T12 veya https://…/masa/T12
 * Masa numarasını sepete yazar ve menüyü açar. Giriş yapılmamışsa
 * sekmeler önce karşılama ekranına yönlendirir; masa numarası korunur.
 */
export default function TableLink() {
  const { table } = useLocalSearchParams<{ table: string }>();
  const setOrderContext = useStore((s) => s.setOrderContext);
  const clean = String(table ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9ŞÇĞÜÖİ]/g, '')
    .slice(0, 8)
    // QR bağlantılarında Türkçe karakter kullanılmaz: /masa/S12 → Ş12
    .replace(/^S(?=\d)/, 'Ş');

  useEffect(() => {
    if (clean) setOrderContext({ orderMode: 'masa', table: clean });
  }, [clean, setOrderContext]);

  return <Redirect href="/menu" />;
}
