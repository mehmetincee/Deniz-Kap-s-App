import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
export type PaymentMethod = 'kart' | 'cuzdan';

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

  placeOrder: (o: Omit<Order, 'id' | 'createdAt' | 'pearlsEarned' | 'status' | 'lines'>) => Order;
  advanceOrder: (id: string) => void;

  reorder: (order: Order) => void;

  topUp: (amount: number, bonus: number) => void;
  redeem: (title: string, cost: number) => Coupon | null;
  toggleFavorite: (productId: string) => void;

  addReservation: (r: Omit<Reservation, 'id' | 'status'>) => Reservation;
  cancelReservation: (id: string) => void;
};

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
 * Siparişin anlık durumu.
 * DEMO: Backend yokken durum, siparişin üzerinden geçen süreden türetilir
 * (gerçekte POS/mutfak ekranından push ile gelir). Böylece eski siparişler
 * ana sayfada sonsuza dek "alındı" görünmez.
 */
export function liveStatus(order: Order, now = Date.now()): OrderStatus {
  if (order.status === 'teslim') return 'teslim';
  const sec = (now - new Date(order.createdAt).getTime()) / 1000;
  if (sec < 20) return 'alindi';
  if (sec < 60) return 'hazirlaniyor';
  if (sec < 120) return 'hazir';
  return 'teslim';
}

/** Son 12 aydaki sipariş harcaması: seviye buna göre belirlenir ve zamanla düşer. */
export function spendLast12Months(orders: Order[], now = Date.now()) {
  const from = now - 365 * 24 * 3600 * 1000;
  return orders.filter((o) => new Date(o.createdAt).getTime() >= from).reduce((s, o) => s + o.subtotal, 0);
}

export function useTier() {
  const orders = useStore((s) => s.orders);
  const spend = spendLast12Months(orders);
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
      setOrderContext: (patch) => set(patch),

      signIn: (name, phone) =>
        set((s) => {
          const user = {
            name,
            phone,
            memberNo: `DK${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
            joinedAt: new Date().toISOString(),
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
        const { current } = tierFor(spendLast12Months(s.orders));
        const earned = Math.floor((o.total - o.tip) * current.rate);
        const order: Order = {
          ...o,
          id: uid('S'),
          createdAt: new Date().toISOString(),
          lines: s.cart,
          pearlsEarned: earned,
          status: 'alindi',
        };
        const now = new Date().toISOString();
        set({
          orders: [order, ...s.orders],
          cart: [],
          wallet: o.payment === 'cuzdan' ? s.wallet - o.total : s.wallet,
          pearls: s.pearls - o.pearlsUsed + earned,
          activity: [
            { id: uid('A'), at: now, title: `Sipariş #${order.id.slice(-5)}`, pearls: earned - o.pearlsUsed, amount: -o.total },
            ...s.activity,
          ],
        });
        return order;
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
      version: 2,
      // v1 → v2: yearSpend kaldırıldı (artık siparişlerden hesaplanıyor), kupon/favori eklendi
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          delete old.yearSpend;
          const user = old.user as User | null | undefined;
          return { ...initialData, ...old, coupons: [], favorites: [], welcomed: user ? [user.phone] : [] } as unknown as State;
        }
        return old as unknown as State;
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
