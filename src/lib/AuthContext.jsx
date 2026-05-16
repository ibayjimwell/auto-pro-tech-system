import React, { createContext, useState, useContext, useEffect } from "react";
import apiClient from "@/api/client";
import { notify } from "@/lib/notify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoadingAuth(false);
  }, []);

  /**
   * Staff login via backend API
   */
  const login = async (username, password) => {
    try {
      const res = await apiClient.post('/auth/staff/login', { username, password });
      const data = res.data;

      if (!data.success) {
        notify.error(data.message || 'Login failed');
        return { success: false, message: data.message };
      }

      // If needs password reset, return reset info without logging in fully
      if (data.needsReset) {
        return {
          success: false,
          needsReset: true,
          resetToken: data.resetToken,
          staff: data.staff,
          message: 'You must change your temporary password before accessing the system.',
        };
      }

      // Normal login
      const userData = {
        id: data.staff.id,
        username: data.staff.username,
        name: data.staff.fullName,
        role: data.staff.role || 'staff',
        permissions: data.staff.permissions || [],
      };

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setToken(data.token);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      notify.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const hasPermission = (module) => {
    if (!isAuthenticated || !user) return false;
    // Admin has access to everything
    if (user.role === 'Admin' || user.role === 'admin') return true;
    // Check if user has the module in their permissions
    return Array.isArray(user.permissions) && user.permissions.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoadingAuth,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Alias for backward compatibility
export const AutoCareAuthProvider = AuthProvider;
export const useAutoAuth = useAuth;