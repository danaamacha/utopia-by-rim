// frontend/src/store/cartStore.js
import { create } from "zustand";

export const useCart = create((set) => ({
  items: [],
  add: (item) => set((state) => {
    const exists = state.items.find((i) => i.id === item.id);
    if (exists) {
      return {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i
        ),
      };
    }
    return { items: [...state.items, { ...item, qty: 1 }] };
  }),
  clear: () => set({ items: [] }),
}));
