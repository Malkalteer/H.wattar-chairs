import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const { data } = await api.get('/auth/favorites');
      setFavorites(data.favorites || []);
    } catch (error) {
      setFavorites([]);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (productId) => {
    if (!user) return false;
    try {
      const { data } = await api.post('/auth/favorites', { productId });
      setFavorites(data.favorites || []);
      return true;
    } catch (error) {
      return false;
    }
  };

  const value = useMemo(
    () => ({ favorites, setFavorites, fetchFavorites, toggleFavorite }),
    [favorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => useContext(FavoritesContext);
