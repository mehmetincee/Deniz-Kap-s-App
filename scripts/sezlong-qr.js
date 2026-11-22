/**
 * Şezlong QR kartları — yazdırılabilir A4 sayfa üretir.
 *
 * Kullanım:  node scripts/sezlong-qr.js 1 40 > sezlong-qr.html
 * Sonra dosyayı tarayıcıda açıp yazdırın (A4, kenar boşluğu yok). Her sayfada 6 kart.
 * Kartlar lamine edilip şezlong/şemsiye direğine takılır.
 */
const QRCode = require('qrcode');

const BASE = process.env.APP_LINK_BASE || 'https://app.denizkapisi.com.tr';
const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 40);

(async () => {
  const cards = [];
  for (let n = from; n <= to; n++) {
    const url = `${BASE}/masa/S${n}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#14224F', light: '#FFFFFF' } });
    cards.push(`<section class="card">
  <p class="brand">DENİZ KAPISI</p>
  <p class="spot">Ş${n}</p>
  <div class="qr">${svg}</div>
  <p class="tr">Okutun, şezlongunuzdan sipariş verin.<br>Hesabı ayrılırken ödeyin, İnci kazanın.</p>
  <p class="en">Scan to order to your sunbed · Pay when you leave</p>
  <p class="url">${url.replace('https://', '')}</p>
</section>`);
  }
  process.stdout.write(`<!doctype html><html lang="tr"><meta charset="utf-8"><title>Şezlong QR ${from}–${to}</title>
<style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: Montserrat, Arial, sans-serif; color: #14224F }
.sheet { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 99mm; width: 210mm; padding: 0 0 }
.card { border: 0.3mm dashed #bbb; padding: 7mm; text-align: center; background: #F5EFE4; break-inside: avoid }
.brand { margin: 0; font-size: 9pt; letter-spacing: 3pt; font-weight: 600 }
.spot { margin: 1mm 0 2mm; font: 600 30pt Georgia, serif }
.qr { width: 46mm; height: 46mm; margin: 0 auto; background: #fff; padding: 2.5mm; border-radius: 2mm }
.qr svg { width: 100%; height: 100% }
.tr { margin: 3mm 0 1mm; font-size: 9pt; line-height: 1.35 }
.en { margin: 0; font-size: 7.5pt; color: #5B4942 }
.url { margin: 1.5mm 0 0; font-size: 6.5pt; color: #8A7F75 }
</style><div class="sheet">${cards.join('\n')}</div></html>`);
})();
