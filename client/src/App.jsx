import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AdminShell } from "./components/layout/AdminShell";
import { PublicShell } from "./components/layout/PublicShell";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { routeRoles } from "./constants/navigation";
import { LoginPage } from "./pages/auth/LoginPage";
import { PremiumDashboard } from "./pages/admin/PremiumDashboard";
import { POSPage } from "./pages/admin/POSPage";
import { OrdersPage } from "./pages/admin/OrdersPage";
import { KitchenDisplayPage } from "./pages/admin/KitchenDisplayPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { TablesPage } from "./pages/admin/TablesPage";
import { ReservationsPage } from "./pages/admin/ReservationsPage";
import { CRMPage } from "./pages/admin/CRMPage";
import { EmployeesPage } from "./pages/admin/EmployeesPage";
import { StockPage } from "./pages/admin/StockPage";
import { PaymentsPage } from "./pages/admin/PaymentsPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { TenantsPage } from "./pages/admin/TenantsPage";
import { PublicHomePage } from "./pages/public/PublicHomePage";
import { PublicMenuPage } from "./pages/public/PublicMenuPage";
import { PublicCartPage } from "./pages/public/PublicCartPage";
import { PublicCheckoutPage } from "./pages/public/PublicCheckoutPage";
import { PublicReservationPage } from "./pages/public/PublicReservationPage";
import { PublicContactPage } from "./pages/public/PublicContactPage";
import { PublicTrackPage } from "./pages/public/PublicTrackPage";
import { NotFoundPage } from "./pages/public/NotFoundPage";
import { AccessDeniedPage } from "./pages/public/AccessDeniedPage";
import { MaintenancePage } from "./pages/public/MaintenancePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          {/* ── Super Admin : gestion des tenants SaaS ── */}
          <Route path="tenants" element={
            <ProtectedRoute roles={["SUPER_ADMIN"]}>
              <TenantsPage />
            </ProtectedRoute>
          } />
          {/* ── Opérationnel ── */}
          <Route path="dashboard"    element={<ProtectedRoute moduleId="dashboard"    roles={routeRoles.dashboard}>   <PremiumDashboard /></ProtectedRoute>} />
          <Route path="pos"          element={<ProtectedRoute moduleId="pos"          roles={routeRoles.pos}>          <POSPage /></ProtectedRoute>} />
          <Route path="orders"       element={<ProtectedRoute moduleId="orders"       roles={routeRoles.orders}>       <OrdersPage /></ProtectedRoute>} />
          <Route path="kitchen"      element={<ProtectedRoute moduleId="kitchen"      roles={routeRoles.kitchen}>      <KitchenDisplayPage /></ProtectedRoute>} />
          <Route path="products"     element={<ProtectedRoute moduleId="products"     roles={routeRoles.products}>     <ProductsPage /></ProtectedRoute>} />
          <Route path="tables"       element={<ProtectedRoute moduleId="tables"       roles={routeRoles.tables}>       <TablesPage /></ProtectedRoute>} />
          <Route path="reservations" element={<ProtectedRoute moduleId="reservations" roles={routeRoles.reservations}> <ReservationsPage /></ProtectedRoute>} />
          <Route path="customers"    element={<ProtectedRoute moduleId="customers"    roles={routeRoles.customers}>    <CRMPage /></ProtectedRoute>} />
          <Route path="employees"    element={<ProtectedRoute moduleId="employees"    roles={routeRoles.employees}>    <EmployeesPage /></ProtectedRoute>} />
          <Route path="stock"        element={<ProtectedRoute moduleId="stock"        roles={routeRoles.stock}>        <StockPage /></ProtectedRoute>} />
          <Route path="stocks"       element={<ProtectedRoute moduleId="stock"        roles={routeRoles.stock}>        <StockPage /></ProtectedRoute>} />
          <Route path="payments"     element={<ProtectedRoute moduleId="payments"     roles={routeRoles.payments}>     <PaymentsPage /></ProtectedRoute>} />
          <Route path="reports"      element={<ProtectedRoute moduleId="reports"      roles={routeRoles.reports}>      <ReportsPage /></ProtectedRoute>} />
          <Route path="settings"     element={<ProtectedRoute moduleId="settings"     roles={routeRoles.settings}>     <SettingsPage /></ProtectedRoute>} />
        </Route>
        <Route path="/" element={<PublicShell />}>
          <Route index element={<PublicHomePage />} />
          <Route path="menu"        element={<PublicMenuPage />} />
          <Route path="cart"        element={<PublicCartPage />} />
          <Route path="checkout"    element={<PublicCheckoutPage />} />
          <Route path="reservation" element={<PublicReservationPage />} />
          <Route path="contact"     element={<PublicContactPage />} />
          <Route path="track"       element={<PublicTrackPage />} />
        </Route>
        <Route path="/:slug" element={<PublicShell />}>
          <Route index element={<PublicHomePage />} />
          <Route path="menu"        element={<PublicMenuPage />} />
          <Route path="cart"        element={<PublicCartPage />} />
          <Route path="checkout"    element={<PublicCheckoutPage />} />
          <Route path="reservation" element={<PublicReservationPage />} />
          <Route path="contact"     element={<PublicContactPage />} />
          <Route path="track"       element={<PublicTrackPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
