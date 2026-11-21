import { useEffect, useState } from 'react';
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
  /** Son 12 ay harcaması — seviye hesabı için. */
  yearSpend: number;
  activity: Activity[];
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

  topUp: (amount: number, bonus: number) => void;
  redeem: (title: string, cost: number) => boolean;

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

export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      pearls: 0,
      wallet: 0,
      yearSpend: 0,
      activity: [],
      cart: [],
      orders: [],
      reservations: [],
      orderMode: 'masa',
      table: '',
      setOrderContext: (patch) => set(patch),

      signIn: (name, phone) =>
        set((s) => ({
          user: {
            name,
            phone,
            memberNo: `DK${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
            joinedAt: new Date().toISOString(),
          },
          // Hoş geldin hediyesi: ilk çay bizden
          pearls: s.pearls + 75,
          activity: [{ id: uid('A'), at: new Date().toISOString(), title: 'Hoş geldin hediyesi', pearls: 75 }, ...s.activity],
        })),
      signOut: () => set({ user: null, cart: [] }),
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
        const { current } = tierFor(s.yearSpend);
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
          yearSpend: s.yearSpend + o.subtotal,
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

      topUp: (amount, bonus) =>
        set((s) => ({
          wallet: s.wallet + amount,
          pearls: s.pearls + bonus,
          activity: [{ id: uid('A'), at: new Date().toISOString(), title: 'Cüzdana yükleme', amount, pearls: bonus }, ...s.activity],
        })),
      redeem: (title, cost) => {
        if (get().pearls < cost) return false;
        set((s) => ({
          pearls: s.pearls - cost,
          activity: [{ id: uid('A'), at: new Date().toISOString(), title: `Ödül: ${title}`, pearls: -cost }, ...s.activity],
        }));
        return true;
      },

      addReservation: (r) => {
        const res: Reservation = { ...r, id: uid('R'), status: 'beklemede' };
        set((s) => ({ reservations: [res, ...s.reservations] }));
        return res;
      },
      cancelReservation: (id) =>
        set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'iptal' } : r)) })),
    }),
    { name: 'deniz-kapisi', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);

/** Kalıcı depodan okuma tamamlandı mı? (Yönlendirme kararları bundan sonra verilmeli.) */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
