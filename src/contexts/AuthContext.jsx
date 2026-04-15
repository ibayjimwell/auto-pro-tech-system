/**
 * Auth Context Re-exports
 *
 * This file re-exports the auth context from src/lib/AuthContext.jsx
 * for backward compatibility with imports from @/contexts/AuthContext
 */

import { AuthProvider, useAuth } from "@/lib/AuthContext";

// Re-export with consistent naming
export const AutoCareAuthProvider = AuthProvider;
export const useAutoAuth = useAuth;
