/**
 * Ödeme katmanı.
 *
 * ŞU AN: Demo — kart ödemesi simüle edilir, hiçbir kart verisi işlenmez.
 *
 * YAYIN ÖNCESİ (önerilen akış — iyzico veya PayTR):
 *  1. Uygulama sepeti backend'e gönderir:  POST /orders  → { orderId, amount }
 *  2. Backend iyzico "Checkout Form" / PayTR iFrame token'ı üretir (API anahtarları
 *     YALNIZCA sunucuda durur) ve ödeme sayfası URL'sini döner.
 *  3. Uygulama bu sayfayı WebView / in-app browser içinde açar; 3D Secure burada tamamlanır.
 *  4. iyzico sonucu backend'in callback URL'sine bildirir; backend siparişi "ödendi"
 *     yapar, POS/mutfak ekranına iletir ve İnci'yi hesaba işler.
 *  5. Uygulama sipariş durumunu backend'den (polling veya push) takip eder.
 *
 * Kart bilgisi uygulamada saklanmaz; kayıtlı kart için iyzico "card storage" (token)
 * kullanılır. Bu sayede PCI-DSS kapsamı ödeme kuruluşunda kalır.
 */
export type PaymentResult = { ok: true; reference: string } | { ok: false; message: string };

export async function payWithCard(amount: number): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 1200));
  if (amount <= 0) return { ok: false, message: 'Geçersiz tutar' };
  return { ok: true, reference: `DEMO-${Date.now()}` };
}
