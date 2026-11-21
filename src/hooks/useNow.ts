import { useEffect, useState } from 'react';

/** Saati render dışında tutar; verilen aralıkla yenilenir (zamana bağlı arayüzler için). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
