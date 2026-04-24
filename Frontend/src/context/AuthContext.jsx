import { createContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AUTH INTERCEPTOR: Automatically adds Token to every API call
  API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // No need to pass headers manually now, the interceptor does it!
          const { data } = await API.get("/users/profile");

          // CRITICAL FIX: Spread the profile data AND re-add the token
          setUser({ ...data, token });
        } catch (error) {
          console.error("Session expired or invalid");
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    // Hits https://your-backend.vercel.app/api/users/login
    const { data } = await API.post("/users/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
