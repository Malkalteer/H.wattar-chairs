import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) {
      setCart([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/auth/cart');
      setCart(data.cart || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  // كل الدوال ترجع { ok, message } ليتمكن المستدعي من عرض رسالة الخادم
  const addToCart = async (productId, quantity = 1, options = {}) => {
    if (!user) return { ok: false, message: 'سجّل الدخول للمتابعة.' };
    try {
      const { data } = await api.post('/auth/cart', { productId, quantity, color: options.color || '', colorHex: options.colorHex || '', fabric: options.fabric || '' });
      setCart(data.cart || []);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'تعذر إضافة المنتج إلى السلة.') };
    }
  };

  const updateQuantity = async (item, quantity) => {
    if (!user) return { ok: false };
    try {
      const { data } = await api.put('/auth/cart', { productId: item.product?._id, quantity, color: item.color || '', colorHex: item.colorHex || '', fabric: item.fabric || '' });
      setCart(data.cart || []);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'تعذر تحديث الكمية.') };
    }
  };

  const removeFromCart = async (item) => {
    if (!user) return { ok: false };
    try {
      const { data } = await api.delete(`/auth/cart/${item.product?._id}`, { params: { color: item.color || '', colorHex: item.colorHex || '', fabric: item.fabric || '' } });
      setCart(data.cart || []);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'تعذر حذف المنتج من السلة.') };
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);

  const value = useMemo(
    () => ({ cart, loading, addToCart, updateQuantity, removeFromCart, refreshCart, totalItems, subtotal }),
    [cart, loading, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
