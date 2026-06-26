// Cart context — exposes the current cart, item count, and add/remove helpers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthed, isCustomer } = useAuth();
  const [items, setItems] = useState([]);
  const [pricing, setPricing] = useState({
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    delivery: 0,
    total: 0,
    freeItemName: null,
    freeItemValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthed || !isCustomer) {
      setItems([]);
      setPricing({
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        delivery: 0,
        total: 0,
        freeItemName: null,
        freeItemValue: 0,
      });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(data.items || []);
      setPricing(data.pricing || pricing);
    } catch (err) {
      console.warn('[cart] refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthed, isCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId, quantity = 1) => {
      const { data } = await api.post('/cart', { productId, quantity });
      setItems(data.items || []);
      setPricing(data.pricing || pricing);
      setDrawerOpen(true);
      return data;
    },
    [pricing]
  );

  const setQty = useCallback(async (productId, quantity) => {
    const { data } = await api.patch(`/cart/${productId}`, { quantity });
    setItems(data.items || []);
    setPricing(data.pricing || pricing);
    return data;
  }, [pricing]);

  const remove = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setItems(data.items || []);
    setPricing(data.pricing || pricing);
    return data;
  }, [pricing]);

  const clear = useCallback(async () => {
    const { data } = await api.delete('/cart');
    setItems(data.items || []);
    setPricing(data.pricing || pricing);
    return data;
  }, [pricing]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({
      items,
      pricing,
      loading,
      drawerOpen,
      openDrawer,
      closeDrawer,
      refresh,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, pricing, loading, drawerOpen, openDrawer, closeDrawer, refresh, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}