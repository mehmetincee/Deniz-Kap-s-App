import * as Crypto from 'expo-crypto';

/**
 * Kart QR kodu: DK1.<üyeNo>.<zaman dilimi>.<imza>
 *
 * - Zaman dilimi 30 saniyede bir değişir; imza = SHA-256(üyeNo.dilim.gizliAnahtar)'ın ilk 10 hanesi.
 * - Gizli anahtar yalnızca misafirin telefonunda ve sunucuda bulunur. Bu yüzden ekran görüntüsü
 *   ya da başkasının üye numarasıyla sahte kod üretilemez, eski kod birkaç dakika sonra geçersizdir.
 * - Personel paneli kodu okutunca doğrulamayı sunucu yapar (demo modunda bu cihazdaki üye için yerel).
 */
export const CODE_WINDOW_MS = 30_000;

export const windowOf = (now = Date.now()) => Math.floor(now / CODE_WINDOW_MS);

async function sign(memberNo: string, win: number, secret: string) {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${memberNo}.${win}.${secret}`);
  return hex.slice(0, 10).toUpperCase();
}

export async function makeMemberCode(memberNo: string, secret: string, now = Date.now()) {
  const win = windowOf(now);
  return `DK1.${memberNo}.${win}.${await sign(memberNo, win, secret)}`;
}

export type ParsedCode = { memberNo: string; win: number; sig: string };

/** QR içeriğini ayrıştırır; üye numarası elle yazıldıysa (DK12345678) imzasız döner. */
export function parseMemberCode(text: string): ParsedCode | { memberNo: string; manual: true } | null {
  const t = text.trim().toUpperCase();
  const m = /^DK1\.(DK\d{8})\.(\d+)\.([0-9A-F]{10})$/.exec(t);
  if (m) return { memberNo: m[1], win: Number(m[2]), sig: m[3] };
  if (/^DK\d{8}$/.test(t)) return { memberNo: t, manual: true };
  return null;
}

/** Kod geçerli mi? Saat farkları için ±2 dilim (yaklaşık 1 dakika) tolerans. */
export async function verifyMemberCode(code: ParsedCode, secret: string, now = Date.now()) {
  const current = windowOf(now);
  if (Math.abs(current - code.win) > 2) return { ok: false as const, reason: 'Kodun süresi dolmuş. Misafirden kartını yeniden açmasını isteyin.' };
  const expected = await sign(code.memberNo, code.win, secret);
  return expected === code.sig ? { ok: true as const } : { ok: false as const, reason: 'Kod doğrulanamadı.' };
}
