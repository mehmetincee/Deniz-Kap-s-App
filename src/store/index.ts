import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { tiers, type TierId } from '../config/restaurant';
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
  title: string;
  pearls?: number;
  amount?: number;
};

export type Coupon = {
  id: string;
  code: string;
  title: string;
  cost: number;
  createdAt: string;
  /** Kupon 30 gün geçerlidir. */
  expiresAt: string;
  used: boolean;
};

export type User = {
  name: string;
  phone: string;
  birthday?: string;
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
  cart: CartLine[];
  orders: Order[];
  reservations: Reservation[];
  /** Sepet bağlamı: masaya mı, gel-al mı; masa / şezlong numarası. */
  orderMode: OrderMode;
  table: string;
  setOrderContext: (patch: Partial<{ orderMode: OrderMode; table: string }>) => void;

  signIn: (name: string, phone: string) => void;
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
  redeem: (title: string, cost: number) => Coupon | null;
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

/** Son 12 aydaki sipariş harcaması: seviye buna göre belirlenir ve zamanla düşer. */
export function spendLast12Months(orders: Order[], now = Date.now()) {
  const from = now - 365 * 24 * 3600 * 1000;
  return orders.filter((o) => new Date(o.createdAt).getTime() >= from).reduce((s, o) => s + o.subtotal, 0);
}

export function useTier() {
  const orders = useStore((s) => s.orders);
  const spend = spendLast12Months(orders.filter((o) => o.paid));
  return { spend, ...tierFor(spend) };
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
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialData,
      welcomed: [],
      staffLog: [],
      setOrderContext: (patch) => set(patch),

      signIn: (name, phone) =>
        set((s) => {
          const user: User = {
            name,
            phone,
            memberNo: `DK${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
            joinedAt: new Date().toISOString(),
            secret: newSecret(),
          };
          // Hoş geldin hediyesi (ilk çay bizden) her telefona yalnızca bir kez
          if (s.welcomed.includes(phone)) return { user };
          return {
            user,
            welcomed: [...s.welcomed, phone],
            pearls: s.pearls + 75,
            activity: [{ id: uid('A'), at: new Date().toISOString(), title: 'Hoş geldin hediyesi', pearls: 75 }, ...s.activity],
          };
        }),
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
        const { current } = tierFor(spendLast12Months(s.orders.filter((x) => x.paid)));
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
        const { current } = tierFor(spendLast12Months(s.orders.filter((x) => x.paid)));
        const earned = Math.floor(order.subtotal * current.rate);
        const now = new Date().toISOString();
        // DEMO: sipariş bu cihazdaki üyeye aitse İnci doğrudan yüklenir; sunucu modunda üyenin hesabına yazılır
        const mine = order.memberNo && order.memberNo === s.user?.memberNo;
        set({
          orders: s.orders.map((o) => (o.id === id ? { ...o, paid: true, paidAt: now, pearlsEarned: earned, status: 'teslim' } : o)),
          pearls: mine ? s.pearls + earned : s.pearls,
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
        const { current } = tierFor(spendLast12Months(s.orders.filter((x) => x.paid)));
        const earned = Math.floor(amount * current.rate);
        const at = new Date(now).toISOString();
        set({
          pearls: s.pearls + earned,
          activity: [{ id: uid('A'), at, title: 'Restoranda harcama', pearls: earned, amount: -amount }, ...s.activity],
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
      redeem: (title, cost) => {
        if (get().pearls < cost) return null;
        const now = new Date();
        const coupon: Coupon = {
          id: uid('K'),
          // Karışmayan karakterlerle 6 haneli kod (0/O, 1/I yok)
          code: Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPRSTUVYZ23456789'[Math.floor(Math.random() * 29)]).join(''),
          title,
          cost,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
          used: false,
        };
        set((s) => ({
          pearls: s.pearls - cost,
          coupons: [coupon, ...s.coupons],
          activity: [{ id: uid('A'), at: now.toISOString(), title: `Ödül: ${title}`, pearls: -cost }, ...s.activity],
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
      version: 3,
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
