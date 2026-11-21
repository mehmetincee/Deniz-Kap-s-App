/**
 * Telefonla giriş (OTP).
 *
 * ŞU AN: Demo — ağ çağrısı yapmaz, "1971" kodunu kabul eder.
 * YAYIN ÖNCESİ: Backend'e bağlanmalı (ör. Supabase Auth + Netgsm/İleti Merkezi SMS
 * ya da Firebase Phone Auth). Doğrulama sunucuda yapılmalı, istemci yalnızca
 * oturum belirtecini (token) saklamalıdır.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function requestOtp(_phone: string): Promise<void> {
  await wait(600);
}

export async function verifyOtp(_phone: string, code: string): Promise<boolean> {
  await wait(500);
  return code === '1971';
}
