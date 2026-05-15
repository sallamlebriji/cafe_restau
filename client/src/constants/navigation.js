import {
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  ChefHat,
  CreditCard,
  Globe2,
  Home,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Table2,
  Users,
  Utensils
} from "lucide-react";

// Types d'établissement supportés
export const ESTABLISHMENT_TYPES = {
  CAFE: "CAFE",
  RESTAURANT: "RESTAURANT",
  CAFE_RESTAURANT: "CAFE_RESTAURANT"
};

// Modules disponibles selon le type d'établissement
export const moduleByType = {
  dashboard:    ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  pos:          ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  orders:       ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  kitchen:      ["RESTAURANT", "CAFE_RESTAURANT"],
  products:     ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  tables:       ["RESTAURANT", "CAFE_RESTAURANT"],
  reservations: ["RESTAURANT", "CAFE_RESTAURANT"],
  customers:    ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  employees:    ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  stock:        ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  payments:     ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  reports:      ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  settings:     ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"],
  tenants:      ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"]  // Super Admin only
};

export const adminNavigation = [
  { id: "dashboard",    label: "Dashboard",       path: "/admin/dashboard",    icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  // ── Section Super Admin ──────────────────────────────────────────────────
  { id: "tenants",      label: "Tenants SaaS",    path: "/admin/tenants",      icon: Globe2,          roles: ["SUPER_ADMIN"], superAdminOnly: true },
  // ── Opérationnel ─────────────────────────────────────────────────────────
  { id: "pos",          label: "POS / Caisse",    path: "/admin/pos",          icon: ShoppingCart,    badge: "Live", roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER"] },
  { id: "orders",       label: "Commandes",       path: "/admin/orders",       icon: ReceiptText,     badge: "8",    roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"] },
  { id: "kitchen",      label: "Cuisine",         path: "/admin/kitchen",      icon: ChefHat,                        roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "KITCHEN", "BAR"] },
  { id: "products",     label: "Menu",            path: "/admin/products",     icon: Utensils,                       roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { id: "tables",       label: "Tables",          path: "/admin/tables",       icon: Table2,                         roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER"] },
  { id: "reservations", label: "Reservations",    path: "/admin/reservations", icon: CalendarDays,                   roles: ["SUPER_ADMIN", "MANAGER"] },
  { id: "customers",    label: "Clients",         path: "/admin/customers",    icon: Users,                          roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "CASHIER"] },
  { id: "employees",    label: "Employes",        path: "/admin/employees",    icon: Building2,                      roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { id: "stock",        label: "Stocks",          path: "/admin/stock",        icon: Boxes,           badge: "3",    roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "KITCHEN", "BAR"] },
  { id: "payments",     label: "Paiements",       path: "/admin/payments",     icon: CreditCard,                     roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "CASHIER"] },
  { id: "reports",      label: "Rapports",        path: "/admin/reports",      icon: BarChart3,                      roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { id: "settings",     label: "Parametres",      path: "/admin/settings",     icon: Settings,                       roles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT"] }
];

export const moduleLabels = Object.fromEntries(adminNavigation.map((item) => [item.id, item.label]));

export const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_ESTABLISHMENT: "Admin etablissement",
  MANAGER: "Manager",
  WAITER: "Serveur",
  CASHIER: "Caissier",
  KITCHEN: "Cuisine",
  BAR: "Bar",
  CLIENT: "Client"
};

export const establishmentTypeLabels = {
  CAFE: "Café",
  RESTAURANT: "Restaurant",
  CAFE_RESTAURANT: "Café-Restaurant"
};

export const roleHome = {
  SUPER_ADMIN:         "/admin/tenants",     // SA atterrit sur la page tenants
  ADMIN_ESTABLISHMENT: "/admin/dashboard",
  MANAGER:             "/admin/dashboard",
  WAITER:              "/admin/pos",
  CASHIER:             "/admin/payments",
  KITCHEN:             "/admin/kitchen",
  BAR:                 "/admin/kitchen",
  CLIENT:              "/"
};

export const hasModuleAccess = (role, moduleId, moduleAccess) => {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  const fallback = adminNavigation.find((item) => item.id === moduleId)?.roles || [];
  const roles = moduleAccess?.[moduleId] || fallback;
  return roles.includes(role);
};

export const isModuleEnabledForType = (moduleId, establishmentType, role) => {
  if (role === "SUPER_ADMIN") return true;
  if (!establishmentType) return true;
  const allowed = moduleByType[moduleId];
  if (!allowed) return true;
  return allowed.includes(establishmentType);
};

export const getNavigationForRole = (role, moduleAccess, establishmentType) => {
  if (!role) return adminNavigation;
  return adminNavigation.filter((item) => {
    // Les items superAdminOnly ne sont visibles que par le SA
    if (item.superAdminOnly && role !== "SUPER_ADMIN") return false;
    return (
      hasModuleAccess(role, item.id, moduleAccess) &&
      isModuleEnabledForType(item.id, establishmentType, role)
    );
  });
};

export const getHomeForRole = (role, moduleAccess, establishmentType) => {
  const preferred = roleHome[role] || "/admin/dashboard";
  const preferredModule = adminNavigation.find((item) => item.path === preferred)?.id;
  if (!moduleAccess || hasModuleAccess(role, preferredModule, moduleAccess)) {
    if (isModuleEnabledForType(preferredModule, establishmentType, role)) return preferred;
  }
  return getNavigationForRole(role, moduleAccess, establishmentType)[0]?.path || "/access-denied";
};

export const routeRoles = adminNavigation.reduce((acc, item) => {
  const route = item.path.replace("/admin/", "");
  acc[route] = item.roles;
  return acc;
}, {});

export const publicNavigation = [
  { label: "Accueil",     path: "/",           icon: Home },
  { label: "Menu",        path: "/menu",        icon: Package },
  { label: "Reservation", path: "/reservation", icon: CalendarDays },
  { label: "Contact",     path: "/contact",     icon: Users }
];
