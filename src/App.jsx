import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AutoCareAuthProvider, useAutoAuth } from "@/contexts/AuthContext";

// Layout
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import LoginPage from "@/components/auth/LoginPage";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Appointments from "@/pages/Appointments";
import ServiceTypes from "@/pages/ServiceTypes";
import Staff from "@/pages/Staff";
import ServiceTracking from "@/pages/ServiceTracking";
import Invoices from "@/pages/Invoices";
import Inventory from "@/pages/Inventory";

const ROLE_HOME = {
  admin: "/",
  staff: "/",
  mechanic: "/service-tracking",
  cashier: "/invoices",
};

function AuthGate({ children }) {
  const { user, isLoading } = useAutoAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleHome() {
  const { user } = useAutoAuth();
  const home = ROLE_HOME[user?.role] || "/";
  if (home !== "/") return <Navigate to={home} replace />;
  return <Dashboard />;
}

function App() {
  return (
    <AutoCareAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected with layout */}
            <Route
              element={
                <AuthGate>
                  <AppLayout />
                </AuthGate>
              }
            >
              <Route path="/" element={<RoleHome />} />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute module="Customers">
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute module="Appointments">
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-types"
                element={
                  <ProtectedRoute module="Service Types">
                    <ServiceTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute module="Staff">
                    <Staff />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-tracking"
                element={
                  <ProtectedRoute module="Service Tracking">
                    <ServiceTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute module="Invoices">
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute module="Inventory">
                    <Inventory />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </AutoCareAuthProvider>
  );
}

export default App;
