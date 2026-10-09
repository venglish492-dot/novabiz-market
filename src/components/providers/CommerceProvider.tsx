'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPersistentStore } from '@/lib/client/persistent-store';
import { track } from '@/lib/client/analytics';
import {
  clearCartAction,
  getProductSummariesAction,
  setCartItemAction,
  setWishlistItemAction,
  syncCartAction,
  syncWishlistAction,
} from '@/lib/actions/commerce';
import type { ProductSummary } from '@/lib/catalog/summary';
import { useSession } from './SessionProvider';

/*
 * Cart and wishlist state. Snapshots of product summaries are kept locally for
 * instant rendering, refreshed from the server on load (prices/availability),
 * and mirrored to the account when signed in. Prices shown here are for
 * display only: checkout always recalculates on the server.
 */

const EMPTY: ProductSummary[] = [];

function validateSummaries(value: unknown): ProductSummary[] {
  if (!Array.isArray(value)) return EMPTY;
  return value.filter(
    (item): item is ProductSummary =>
      Boolean(item) && typeof item === 'object' && typeof item.id === 'string' && typeof item.slug === 'string' && Boolean(item.price),
  );
}

const cartStore = createPersistentStore<ProductSummary[]>('vl-cart-v1', EMPTY, validateSummaries);
const wishlistStore = createPersistentStore<ProductSummary[]>('vl-wishlist-v1', EMPTY, validateSummaries);

const noopSubscribe = () => () => undefined;

interface ListApi {
  items: ProductSummary[];
  count: number;
  hydrated: boolean;
  has: (id: string) => boolean;
}

interface CartApi extends ListApi {
  add: (product: ProductSummary) => 'added' | 'exists';
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  owned: (id: string) => boolean;
}

interface WishlistApi extends ListApi {
  toggle: (product: ProductSummary) => boolean;
}

const CartContext = createContext<CartApi | null>(null);
const WishlistContext = createContext<WishlistApi | null>(null);

function useSyncedList(store: typeof cartStore, sync: (ids: string[]) => Promise<string[] | null>, userId: string | null) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    const key = userId ?? 'guest';
    if (syncedFor.current === key) return;
    syncedFor.current = key;
    const localIds = store.getSnapshot().map((item) => item.id);
    let cancelled = false;
    (async () => {
      const ids = userId ? ((await sync(localIds)) ?? localIds) : localIds;
      const fresh = ids.length ? await getProductSummariesAction(ids) : EMPTY;
      if (!cancelled && (fresh.length || localIds.length)) store.set(fresh);
    })().catch(() => {
      // Keep the local snapshot if the network is unavailable.
    });
    return () => {
      cancelled = true;
    };
  }, [store, sync, userId]);

  return items;
}

export function CommerceProvider({ children, ownedProductIds }: { children: ReactNode; ownedProductIds: string[] }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const cartItems = useSyncedList(cartStore, syncCartAction, userId);
  const wishlistItems = useSyncedList(wishlistStore, syncWishlistAction, userId);
  const [isOpen, setIsOpen] = useState(false);
  const owned = useMemo(() => new Set(ownedProductIds), [ownedProductIds]);

  const cartHas = useCallback((id: string) => cartItems.some((item) => item.id === id), [cartItems]);
  const wishlistHas = useCallback((id: string) => wishlistItems.some((item) => item.id === id), [wishlistItems]);

  const add = useCallback(
    (product: ProductSummary) => {
      if (cartStore.getSnapshot().some((item) => item.id === product.id)) return 'exists' as const;
      cartStore.set((list) => [...list, product]);
      if (userId) void setCartItemAction(product.id, true);
      track('add_to_cart', { productId: product.id });
      return 'added' as const;
    },
    [userId],
  );

  const remove = useCallback(
    (id: string) => {
      cartStore.set((list) => list.filter((item) => item.id !== id));
      if (userId) void setCartItemAction(id, false);
      track('remove_from_cart', { productId: id });
    },
    [userId],
  );

  const clear = useCallback(() => {
    cartStore.set(EMPTY);
    if (userId) void clearCartAction();
  }, [userId]);

  const toggle = useCallback(
    (product: ProductSummary) => {
      const exists = wishlistStore.getSnapshot().some((item) => item.id === product.id);
      wishlistStore.set((list) => (exists ? list.filter((item) => item.id !== product.id) : [...list, product]));
      if (userId) void setWishlistItemAction(product.id, !exists);
      if (!exists) track('wishlist_add', { productId: product.id });
      return !exists;
    },
    [userId],
  );

  const cart = useMemo<CartApi>(
    () => ({
      items: hydrated ? cartItems : EMPTY,
      count: hydrated ? cartItems.length : 0,
      hydrated,
      has: cartHas,
      add,
      remove,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      owned: (id: string) => owned.has(id),
    }),
    [hydrated, cartItems, cartHas, add, remove, clear, isOpen, owned],
  );

  const wishlist = useMemo<WishlistApi>(
    () => ({
      items: hydrated ? wishlistItems : EMPTY,
      count: hydrated ? wishlistItems.length : 0,
      hydrated,
      has: wishlistHas,
      toggle,
    }),
    [hydrated, wishlistItems, wishlistHas, toggle],
  );

  return (
    <CartContext.Provider value={cart}>
      <WishlistContext.Provider value={wishlist}>{children}</WishlistContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart(): CartApi {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CommerceProvider>');
  return value;
}

export function useWishlist(): WishlistApi {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used inside <CommerceProvider>');
  return value;
}
