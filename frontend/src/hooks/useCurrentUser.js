import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STORAGE_KEY = "freepay_current_user_id";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const fetchOrResolveUser = useCallback(async () => {
    setLoading(true);
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      const { data: users } = await axios.get(`${API}/users`);

      if (users.length === 0) {
        setNeedsSetup(true);
        setCurrentUser(null);
        return;
      }

      // Try to use the stored user id, fall back to first user
      const found = storedId ? users.find((u) => u.id === storedId) : null;
      const user = found || users[0];
      localStorage.setItem(STORAGE_KEY, user.id);
      setCurrentUser(user);
      setNeedsSetup(false);
    } catch (err) {
      console.error("Failed to resolve current user", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFirstUser = useCallback(async (name, email) => {
    const { data: user } = await axios.post(`${API}/users`, { name, email });
    localStorage.setItem(STORAGE_KEY, user.id);
    setCurrentUser(user);
    setNeedsSetup(false);
    return user;
  }, []);

  const switchUser = useCallback((user) => {
    localStorage.setItem(STORAGE_KEY, user.id);
    setCurrentUser(user);
  }, []);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data } = await axios.get(`${API}/users/${currentUser.id}`);
      setCurrentUser(data);
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchOrResolveUser();
  }, [fetchOrResolveUser]);

  return { currentUser, loading, needsSetup, createFirstUser, switchUser, refresh, refetch: fetchOrResolveUser };
}
