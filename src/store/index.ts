import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { gifts, tiers, type TierId } from '../config/restaurant';
import { deviceLang, type Lang } from '../i18n/lang';
import { translate } from '../i18n/translate';
import type { StringKey } from '../i18n/strings';
import type { Product } from '../data/menu';

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  optionName?: string;
  unitPrice: number;
  qty: number;
  note?: string;
};

export type OrderMode = 'masa' | 'gelal';
/** 'hesap': uygulamada ödeme yok, hesap garsona/kasaya ödenir (plaj pilotu). */
export type PaymentMethod = 'kart' | 'cuzdan' | 'hesap';

export type OrderStatus = 'alindi' | 'hazirlaniyor' | 'hazir' | 'teslim';

export type Order = {
  id: string;
  createdAt: string;
  lines: CartLine[];
  mode: OrderMode;
  table?: string;
  pickupTime?: string;
  subtotal: number;
  tip: number;
  pearlsUsed: number;
  total: number;
  pearlsEarned: number;
  payment: PaymentMethod;
  status: OrderStatus;
  /** Ödeme alındı mı? 'hesap' siparişlerinde personel panelinden işaretlenir; İnci o an yüklenir. */
  paid: boolean;
  paidAt?: string;
  memberNo?: string;
  customerName?: string;
};

/** Personelin yaptığı puan işlemleri (kasada QR okutma, ödeme alma). */
export type StaffLog = {
  id: string;
  at: string;
  memberNo: string;
  amount: number;
  pearls: number;
  source: 'qr' | 'siparis' | 'elle';
};

export type Reservation = {
  id: string;
  date: string;
  time: string;
  guests: number;
  area: string;
  occasion?: string;
  note?: string;
  status: 'beklemede' | 'onaylandi' | 'iptal';
};

export type Activity = {
  id: string;
  at: string;
  /** Eski kayıtlar için düz metin; yeni kayıtlar dile göre key + params ile gösterilir. */
  title: string;
  key?: StringKey;
  params?: Record<string, string>;
  pearls?: number;
  amount?: number;
};

export type Coupon = {
  id: string;
  code: string;
  title: string;
  /** Başlığın çeviri anahtarı (ör. gift.welcome, reward.kahve). */
  key?: StringKey;
  kind?: 'gift' | 'reward';
  cost: number;
  createdAt: string;
  /** Kupon 30 gün geçerlidir. */
  expiresAt: string;
  used: boolean;
};

export type User = {
  name: string;
  phone: string;
  /** Yalnızca gün ve ay (yıl istenmez — KVKK veri en aza indirme). */
  birthday?: { day: number; month: number };
  memberNo: string;
  joinedAt: string;
  /** Kart QR'ını imzalamak için kişiye özel gizli anahtar (sunucuda da saklanır). */
  secret: string;
};

type State = {
  user: User | null;
  pearls: number;
  wallet: number;
  activity: Activity[];
  coupons: Coupon[];
  favorites: string[];
  /** Hoş geldin hediyesi verilmiş telefonlar (çıkış yapınca silinmez; tekrar hediye alınamaz). */
  welcomed: string[];
  /** Restorandaki harcamalar (QR okutma, ödenen sipariş): seviye bunlardan hesaplanır. */
  visits: { at: string; amount: number }[];
  /** Doğum günü tatlısı verilen yıllar ("05532…:2026"). */
  birthdayGifts: string[];
  /** Arayüz dili (çıkışta sıfırlanmaz). */
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Doğum günü penceresindeyse tatlı kuponunu oluşturur (yılda bir). */
  grantBirthdayGift: (now?: Date) => void;
  cart: CartLine[];
  orders: Order[];
  reservations: Reservation[];
  /** Sepet bağlamı: masaya mı, gel-al mı; masa / şezlong numarası. */
  orderMode: OrderMode;
  table: string;
  setOrderContext: (patch: Partial<{ orderMode: OrderMode; table: string }>) => void;

  signIn: (name: string, phone: string, birthday?: { day: number; month: number }) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'birthday'>>) => void;

  addToCart: (p: Product, opts: { optionId?: string; qty: number; note?: string }) => void;
  setQty: (key: string, qty: number) => void;
  clearCart: () => void;

  placeOrder: (o: Omit<Order, 'id' | 'createdAt' | 'pearlsEarned' | 'status' | 'lines' | 'paid' | 'memberNo' | 'customerName'>) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  /** Personel: hesap ödendi → İnci yüklenir. */
  markPaid: (id: string) => void;
  /** Personel: kasada okutulan kart için hesap tutarı kadar İnci yükler. */
  creditPearls: (memberNo: string, amount: number, source: StaffLog['source']) => { ok: true; pearls: number } | { ok: false; reason: string };
  staffLog: StaffLog[];
  advanceOrder: (id: string) => void;

  reorder: (order: Order) => void;

  topUp: (amount: number, bonus: number) => void;
  redeem: (rewardId: string, cost: number) => Coupon | null;
  toggleFavorite: (productId: string) => void;

  addReservation: (r: Omit<Reservation, 'id' | 'status'>) => Reservation;
  cancelReservation: (id: string) => void;
};

const newSecret = () => Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

export function tierFor(spend: number) {
  let current: (typeof tiers)[number] = tiers[0];
  for (const t of tiers) if (spend >= t.min) current = t;
  const idx = tiers.findIndex((t) => t.id === current.id);
  const next = tiers[idx + 1];
  return { current, next, progress: next ? (spend - current.min) / (next.min - current.min) : 1 };
}

export function tierById(id: TierId) {
  return tiers.find((t) => t.id === id)!;
}

/**
 * Siparişin anlık durumu. Durumu personel panelinden günceller
 * (sunucu modunda misafirin telefonuna canlı yansır).
 */
export function liveStatus(order: Order, now = Date.now()): OrderStatus {
  if (order.status === 'teslim') return 'teslim';
  // Personel durumu güncellemeyi unutursa sipariş ana sayfada süresiz "aktif" kalmasın
  const hours = (now - new Date(order.createdAt).getTime()) / 3600000;
  return hours > 6 ? 'teslim' : order.status;
}

/** Son 12 aydaki harcama: seviye (kazanım oranı) buna göre belirlenir ve zamanla düşer. */
export function spendLast12Months(visits: { at: string; amount: number }[], now = Date.now()) {
  const from = now - 365 * 24 * 3600 * 1000;
  return visits.filter((v) => new Date(v.at).getTime() >= from).reduce((s, v) => s + v.amount, 0);
}

export function useTier() {
  const visits = useStore((s) => s.visits);
  const spend = spendLast12Months(visits);
  return { spend, ...tierFor(spend) };
}

const couponCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPRSTUVYZ23456789'[Math.floor(Math.random() * 29)]).join('');
const DAY = 24 * 3600 * 1000;

/** Bu yılki doğum günü (yerel saat, gece yarısı). */
function birthdayThisYear(b: { day: number; month: number }, now: Date) {
  return new Date(now.getFullYear(), b.month - 1, b.day);
}

export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

/** Kişiye ait veriler: çıkışta sıfırlanır. */
const initialData = {
  user: null as User | null,
  pearls: 0,
  wallet: 0,
  activity: [] as Activity[],
  coupons: [] as Coupon[],
  favorites: [] as string[],
  cart: [] as CartLine[],
  orders: [] as Order[],
  reservations: [] as Reservation[],
  orderMode: 'masa' as OrderMode,
  table: '',
  visits: [] as { at: string; amount: number }[],
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialData,
      welcomed: [],
      staffLog: [],
      birthdayGifts: [],
      lang: deviceLang(),
      setLang: (lang) => set({ lang }),

      grantBirthdayGift: (now = new Date()) => {
        const s = get();
        const b = s.user?.birthday;
        if (!s.user || !b) return;
        // Yıl sonu/başı geçişi için geçen ve gelecek yılın doğum günü de denenir
        for (const offset of [-1, 0, 1]) {
          const day = birthdayThisYear(b, new Date(now.getFullYear() + offset, 0, 1));
          const from = day.getTime() - gifts.birthday.daysBefore * DAY;
          const until = day.getTime() + (gifts.birthday.daysAfter + 1) * DAY;
          const key = `${s.user.phone}:${day.getFullYear()}`;
          if (now.getTime() >= from && now.getTime() < until && !s.birthdayGifts.includes(key)) {
            const at = now.toISOString();
            const coupon: Coupon = {
              id: uid('K'),
              code: couponCode(),
              title: 'Doğum günü tatlısı',
              key: 'gift.birthday',
              kind: 'gift',
              cost: 0,
              createdAt: at,
              expiresAt: new Date(until).toISOString(),
              used: false,
            };
            set({
              birthdayGifts: [...s.birthdayGifts, key],
              coupons: [coupon, ...s.coupons],
              activity: [{ id: uid('A'), at, title: 'Doğum günü tatlısı', key: 'activity.gift', params: { gift: 'gift.birthday' } }, ...s.activity],
            });
            return;
          }
        }
      },
      setOrderContext: (patch) => set(patch),

      signIn: (name, phone, birthday) => {
        set((s) => {
          const now = new Date();
          const user: User = {
            name,
            phone,
            birthday,
            memberNo: `DK${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
            joinedAt: now.toISOString(),
            secret: newSecret(),
          };
          // İlk kayıtta kahve bizden — her telefona yalnızca bir kez (çıkış/giriş ile tekrar alınamaz)
          if (s.welcomed.includes(phone)) return { user };
          const coupon: Coupon = {
            id: uid('K'),
            code: couponCode(),
            title: 'Hoş geldin kahvesi',
            key: 'gift.welcome',
            kind: 'gift',
            cost: 0,
            createdAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + gifts.welcome.validDays * DAY).toISOString(),
            used: false,
          };
          return {
            user,
            welcomed: [...s.welcomed, phone],
            coupons: [coupon, ...s.coupons],
            activity: [{ id: uid('A'), at: now.toISOString(), title: 'Hoş geldin kahvesi', key: 'activity.gift', params: { gift: 'gift.welcome' } }, ...s.activity],
          };
        });
        get().grantBirthdayGift();
      },
      // Aynı cihazda başka biri giriş yaparsa önceki kişinin bakiyesi, kuponları ve siparişleri görünmemeli.
      signOut: () => set({ ...initialData }),
      updateProfile: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),

      addToCart: (p, { optionId, qty, note }) =>
        set((s) => {
          const opt = p.options?.find((o) => o.id === optionId);
          const key = `${p.id}:${opt?.id ?? ''}:${note ?? ''}`;
          const existing = s.cart.find((l) => l.key === key);
          if (existing) {
            return { cart: s.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) };
          }
          return {
            cart: [
              ...s.cart,
              { key, productId: p.id, name: p.name, optionName: opt?.name, unitPrice: opt?.price ?? p.price, qty, note },
            ],
          };
        }),
      setQty: (key, qty) =>
        set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, qty } : l)) })),
      clearCart: () => set({ cart: [] }),

      placeOrder: (o) => {
        const s = get();
        const { current } = tierFor(spendLast12Months(s.visits));
        const paidNow = o.payment !== 'hesap';
        // Hesapta ödenen siparişte İnci, ödeme alındığında (markPaid) yüklenir
        const earned = paidNow ? Math.floor((o.total - o.tip) * current.rate) : 0;
        const now = new Date().toISOString();
        const order: Order = {
          ...o,
          id: uid('S'),
          createdAt: now,
          lines: s.cart,
          pearlsEarned: earned,
          status: 'alindi',
          paid: paidNow,
          paidAt: paidNow ? now : undefined,
          memberNo: s.user?.memberNo,
          customerName: s.user?.name,
        };
        set({
          orders: [order, ...s.orders],
          visits: paidNow ? [{ at: now, amount: o.subtotal }, ...s.visits] : s.visits,
          cart: [],
          wallet: o.payment === 'cuzdan' ? s.wallet - o.total : s.wallet,
          pearls: s.pearls - o.pearlsUsed + earned,
          activity: [
            {
              id: uid('A'),
              at: now,
              title: `Sipariş #${order.id.slice(-5)}${paidNow ? '' : ' gönderildi'}`,
              pearls: paidNow ? earned - o.pearlsUsed : undefined,
              amount: paidNow ? -o.total : undefined,
            },
            ...s.activity,
          ],
        });
        return order;
      },
      setOrderStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
      markPaid: (id) => {
        const s = get();
        const order = s.orders.find((o) => o.id === id);
        if (!order || order.paid) return;
        const { current } = tierFor(spendLast12Months(s.visits));
        const earned = Math.floor(order.subtotal * current.rate);
        const now = new Date().toISOString();
        // DEMO: sipariş bu cihazdaki üyeye aitse İnci doğrudan yüklenir; sunucu modunda üyenin hesabına yazılır
        const mine = order.memberNo && order.memberNo === s.user?.memberNo;
        set({
          orders: s.orders.map((o) => (o.id === id ? { ...o, paid: true, paidAt: now, pearlsEarned: earned, status: 'teslim' } : o)),
          pearls: mine ? s.pearls + earned : s.pearls,
          visits: mine ? [{ at: now, amount: order.subtotal }, ...s.visits] : s.visits,
          activity: mine
            ? [{ id: uid('A'), at: now, title: `Sipariş #${id.slice(-5)} ödendi`, pearls: earned, amount: -order.subtotal }, ...s.activity]
            : s.activity,
          staffLog: [
            { id: uid('L'), at: now, memberNo: order.memberNo ?? '-', amount: order.subtotal, pearls: earned, source: 'siparis' },
            ...s.staffLog,
          ],
        });
      },
      creditPearls: (memberNo, amount, source) => {
        const s = get();
        if (!(amount > 0) || amount > 100000) return { ok: false, reason: 'Geçerli bir hesap tutarı girin.' };
        if (!s.user || s.user.memberNo !== memberNo) {
          // Başka telefondaki üye: bakiyesi sunucuda tutulur
          return { ok: false, reason: 'Bu üyeye puan yüklemek için sunucu bağlantısı gerekli (demo modunda yalnızca bu cihazdaki üye).' };
        }
        const now = Date.now();
        const recent = s.staffLog.find((l) => l.memberNo === memberNo && l.amount === amount && now - new Date(l.at).getTime() < 10 * 60000);
        if (recent) return { ok: false, reason: 'Aynı tutar bu üyeye son 10 dakikada zaten yüklendi.' };
        const { current } = tierFor(spendLast12Months(s.visits));
        const earned = Math.floor(amount * current.rate);
        const at = new Date(now).toISOString();
        set({
          pearls: s.pearls + earned,
          visits: [{ at, amount }, ...s.visits],
          activity: [{ id: uid('A'), at, title: 'Restoranda harcama', key: 'activity.visit', pearls: earned, amount: -amount }, ...s.activity],
          staffLog: [{ id: uid('L'), at, memberNo, amount, pearls: earned, source }, ...s.staffLog],
        });
        return { ok: true, pearls: earned };
      },
      advanceOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const flow: OrderStatus[] = ['alindi', 'hazirlaniyor', 'hazir', 'teslim'];
            const i = flow.indexOf(o.status);
            return { ...o, status: flow[Math.min(i + 1, flow.length - 1)] };
          }),
        })),

      reorder: (order) =>
        set((s) => {
          const cart = [...s.cart];
          for (const l of order.lines) {
            const i = cart.findIndex((c) => c.key === l.key);
            if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + l.qty };
            else cart.push({ ...l });
          }
          return { cart, orderMode: order.mode, table: order.table ?? s.table };
        }),

      topUp: (amount, bonus) =>
        set((s) => ({
          wallet: s.wallet + amount,
          pearls: s.pearls + bonus,
          activity: [{ id: uid('A'), at: new Date().toISOString(), title: 'Cüzdana yükleme', amount, pearls: bonus }, ...s.activity],
        })),
      redeem: (rewardId, cost) => {
        if (get().pearls < cost) return null;
        const now = new Date();
        const key = `reward.${rewardId}` as StringKey;
        const title = translate('tr', key);
        const coupon: Coupon = {
          id: uid('K'),
          // Karışmayan karakterlerle 6 haneli kod (0/O, 1/I yok)
          code: couponCode(),
          title,
          key,
          kind: 'reward',
          cost,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
          used: false,
        };
        set((s) => ({
          pearls: s.pearls - cost,
          coupons: [coupon, ...s.coupons],
          activity: [{ id: uid('A'), at: now.toISOString(), title: `Ödül: ${title}`, key: 'activity.reward', params: { gift: key }, pearls: -cost }, ...s.activity],
        }));
        return coupon;
      },
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId) ? s.favorites.filter((f) => f !== productId) : [productId, ...s.favorites],
        })),

      addReservation: (r) => {
        const res: Reservation = { ...r, id: uid('R'), status: 'beklemede' };
        set((s) => ({ reservations: [res, ...s.reservations] }));
        return res;
      },
      cancelReservation: (id) =>
        set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'iptal' } : r)) })),
    }),
    {
      name: 'deniz-kapisi',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      // v1 → v2: yearSpend kaldırıldı (artık siparişlerden hesaplanıyor), kupon/favori eklendi
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          delete old.yearSpend;
          const user = old.user as User | null | undefined;
          Object.assign(old, { coupons: [], favorites: [], welcomed: user ? [user.phone] : [] });
        }
        if (version < 3) {
          // v3: siparişlerde ödeme durumu, kullanıcıda QR anahtarı, personel kaydı
          const user = old.user as User | null | undefined;
          if (user && !user.secret) user.secret = newSecret();
          old.orders = ((old.orders as Order[] | undefined) ?? []).map((o) => ({ ...o, paid: o.paid ?? true }));
          old.staffLog = [];
        }
        if (version < 4) {
          // v4: harcama kaydı (visits), doğum günü (gün/ay), dil
          const orders = (old.orders as Order[] | undefined) ?? [];
          old.visits = orders.filter((o) => o.paid).map((o) => ({ at: o.paidAt ?? o.createdAt, amount: o.subtotal }));
          old.birthdayGifts = [];
          const user = old.user as (User & { birthday?: unknown }) | null | undefined;
          if (user && typeof user.birthday === 'string') delete user.birthday;
        }
        return { ...initialData, ...old } as unknown as State;
      },
    },
  ),
);

/** Kalıcı depodan okuma tamamlandı mı? (Yönlendirme kararları bundan sonra verilmeli.) */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
