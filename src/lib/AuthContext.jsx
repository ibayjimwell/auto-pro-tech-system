import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

// Mock user data for development
const MOCK_USERS = {
  admin: {
    id: "user-1",
    email: "admin@autopro.local",
    name: "Admin User",
    role: "admin",
    phone: "555-0100",
  },
  staff: {
    id: "user-2",
    email: "staff@autopro.local",
    name: "John Staff",
    role: "staff",
    phone: "555-0101",
  },
  mechanic: {
    id: "user-3",
    email: "mechanic@autopro.local",
    name: "Mike Mechanic",
    role: "mechanic",
    phone: "555-0102",
  },
  cashier: {
    id: "user-4",
    email: "cashier@autopro.local",
    name: "Sarah Cashier",
    role: "cashier",
    phone: "555-0103",
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("autopro_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("autopro_user");
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const login = (userRole = "admin") => {
    const selectedUser = MOCK_USERS[userRole] || MOCK_USERS.admin;
    setUser(selectedUser);
    setIsAuthenticated(true);
    localStorage.setItem("autopro_user", JSON.stringify(selectedUser));
    return selectedUser;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("autopro_user");
  };

  const hasPermission = (module) => {
    // All authenticated users have access to all modules for now
    // Customize this logic based on user roles later
    return isAuthenticated && user !== null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
