import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyDocumentLanguage, changeAppLanguage, getStoredLanguage, normalizeLanguage } from "../i18n";

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: "light",
      language: getStoredLanguage(),
      sidebarCompact: false,
      commandOpen: false,
      currentTable: null,
      cart: [],
      confirmedOrders: [],
      heldOrders: [],
      notifications: [],
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setLanguage: (language) => {
        const nextLanguage = changeAppLanguage(language);
        set({ language: nextLanguage });
      },
      toggleSidebar: () => set((state) => ({ sidebarCompact: !state.sidebarCompact })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setCurrentTable: (currentTable) => set({ currentTable }),
      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          return {
            cart: existing
              ? state.cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
              : [...state.cart, { ...product, qty: 1, note: "", discount: 0 }]
          };
        }),
      updateCartItem: (id, patch) => set((state) => ({ cart: state.cart.map((item) => (item.id === id ? { ...item, ...patch } : item)) })),
      removeCartItem: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: [] }),
      addConfirmedOrder: (order) =>
        set((state) => ({
          confirmedOrders: [order, ...state.confirmedOrders.filter((item) => item.id !== order.id)]
        })),
      confirmOrder: ({ customer, mode, address, notes }) =>
        set((state) => {
          const now = new Date();
          const id = Date.now();
          const subtotal = state.cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
          const total = subtotal * 1.1;
          const hasKitchenItems = state.cart.some((item) => !["coffee", "tea", "juice"].includes(item.category));
          const order = {
            id,
            code: `ORD-${String(id).slice(-5)}`,
            table: mode === "Sur place" ? "Table client" : mode,
            customer: customer || "Client",
            type: mode === "Livraison" ? "DELIVERY" : mode === "Retrait" ? "COUNTER" : "TABLE",
            server: "Online",
            status: "NEW",
            total,
            createdAt: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            items: state.cart.map((item) => `${item.qty}x ${item.name}`),
            note: [address, notes].filter(Boolean).join(" - "),
            station: hasKitchenItems ? "cuisine" : "bar"
          };

          return {
            confirmedOrders: [order, ...state.confirmedOrders],
            cart: []
          };
        }),
      updateOrderStatus: (id, status) =>
        set((state) => ({
          confirmedOrders: state.confirmedOrders.map((order) => (order.id === id ? { ...order, status } : order))
        })),
      holdCurrentOrder: (order) =>
        set((state) => ({
          heldOrders: [{ id: Date.now(), createdAt: new Date().toISOString(), ...order }, ...state.heldOrders],
          cart: []
        })),
      resumeHeldOrder: (id) =>
        set((state) => {
          const order = state.heldOrders.find((item) => item.id === id);
          if (!order) return state;
          return {
            cart: order.items,
            heldOrders: state.heldOrders.filter((item) => item.id !== id)
          };
        }),
      removeHeldOrder: (id) => set((state) => ({ heldOrders: state.heldOrders.filter((item) => item.id !== id) })),
      pushNotification: (notification) =>
        set((state) => {
          const key = notification.key || `${notification.title}-${notification.body}`;
          const existing = state.notifications.filter((item) => item.key !== key);
          return {
            notifications: [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
                read: false,
                type: "info",
                key,
                ...notification
              },
              ...existing
            ].slice(0, 50)
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item))
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true }))
        })),
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: "restaurant-saas-preferences",
      merge: (persistedState, currentState) => {
        const saved = persistedState?.state || {};
        const language = normalizeLanguage(saved.language || getStoredLanguage());
        applyDocumentLanguage(language);
        const cart = Array.isArray(saved.cart) ? saved.cart : [];
        const confirmedOrders = Array.isArray(saved.confirmedOrders) ? saved.confirmedOrders : [];
        const heldOrders = Array.isArray(saved.heldOrders) ? saved.heldOrders : [];
        const notifications = Array.isArray(saved.notifications)
          ? saved.notifications.map((item) => ({ read: false, createdAt: new Date().toISOString(), type: "info", ...item }))
          : currentState.notifications;

        return {
          ...currentState,
          ...saved,
          language,
          cart,
          confirmedOrders,
          heldOrders,
          notifications
        };
      }
    }
  )
);
