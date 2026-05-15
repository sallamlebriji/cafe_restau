import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)).filter((item) => item.quantity > 0));
  };

  const clear = () => setItems([]);
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const value = useMemo(() => ({ items, addItem, updateQuantity, clear, total }), [items, total]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
