import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAutoAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarDays,
  Wrench,
  UserCog,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Cog,
  X,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { path: "/customers", label: "Customers", icon: Users, module: "customers" },
  { path: "/vehicles", label: "Vehicles", icon: Car, module: "vehicles" },
  {
    path: "/appointments",
    label: "Appointments",
    icon: CalendarDays,
    module: "appointments",
  },
  {
    path: "/service-types",
    label: "Service Types",
    icon: Cog,
    module: "service-types",
  },
  { path: "/staff", label: "Staff", icon: UserCog, module: "staff" },
  {
    path: "/service-tracking",
    label: "Service Tracking",
    icon: Activity,
    module: "service-tracking",
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: Package,
    module: "inventory",
  },
  { path: "/invoices", label: "Invoices", icon: FileText, module: "invoices" },
];

function NavLinks({ items, collapsed, onNavigate }) {
  const location = useLocation();
  return (
    <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== "/" && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { hasPermission, logout, user } = useAutoAuth();
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.module));

  const sidebarContent = (isCollapsed) => (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border min-h-[64px]">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Wrench className="w-5 h-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden flex-1">
            <h1 className="font-heading text-lg font-bold text-secondary leading-tight">
              AUTO PRO TECH
            </h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">
              AutoCare System
            </p>
          </div>
        )}
        {/* Close button on mobile */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <NavLinks
        items={visibleItems}
        collapsed={isCollapsed}
        onNavigate={onMobileClose}
      />

      {/* User & Collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!isCollapsed && user && (
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-sidebar-foreground/90 truncate">
              {user.name || "User"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase">
              {user.role}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors",
              isCollapsed ? "w-full justify-center" : "",
            )}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className="ml-auto p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors hidden lg:block"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "h-screen bg-sidebar text-sidebar-foreground flex-col transition-all duration-300 border-r border-sidebar-border sticky top-0 hidden lg:flex",
          collapsed ? "w-[68px]" : "w-[250px]",
        )}
      >
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-2xl">
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
