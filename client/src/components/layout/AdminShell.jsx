import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Coffee, Globe2, LogOut, Menu, Moon,
  Plus, Search, Sun, Utensils, X, Store
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  establishmentTypeLabels,
  getNavigationForRole,
  roleLabels
} from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { useModuleAccess } from "../../hooks/useModuleAccess";
import { useEstablishmentType } from "../../hooks/useEstablishmentType";
import { useAppStore } from "../../store/useAppStore";
import { changeAppLanguage } from "../../i18n";
import { Button } from "../ui/Button";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";

// ── Badge type établissement ──────────────────────────────────────────────────
const EstablishmentTypeBadge = ({ type }) => {
  if (!type || type === "SUPER_ADMIN") return null;
  const config = {
    CAFE:            { icon: Coffee,   color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    RESTAURANT:      { icon: Utensils, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    CAFE_RESTAURANT: { icon: Store,    color: "bg-gold/20 text-gold border-gold/30" }
  };
  const { icon: Icon, color } = config[type] || config.CAFE_RESTAURANT;
  const label = establishmentTypeLabels[type] || type;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
};

// ── Contenu sidebar (partagé desktop + mobile) ────────────────────────────────
const SidebarContent = ({ compact, onNavClick, navigation, user, establishmentType, activeOrdersCount, onToggle, onLogout, t, i18n, language, setLanguage, theme, toggleTheme }) => {
  const initials = (user?.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const tenantName = user?.establishment?.name || "Maison Cafe";
  const tenantInitial = tenantName.charAt(0).toUpperCase();
  const brand = isSuperAdmin
    ? { eyebrow: "Plateforme", title: "SaaS Console", initial: "S", icon: Globe2, footer: "Console globale" }
    : { eyebrow: tenantName.split(" ")[0] || "Cafe", title: "Cafe Suite", initial: tenantInitial, icon: null, footer: tenantName };
  const BrandIcon = brand.icon;

  return (
    <div className="flex h-full min-h-0 flex-col p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* ── Logo ── */}
      <div className={`mb-6 flex items-center ${compact ? "justify-center" : "justify-between"}`}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold text-xl font-black text-ink">
            {BrandIcon ? <BrandIcon size={23} /> : brand.initial}
          </div>
          {!compact && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">{brand.eyebrow}</p>
              <h1 className="text-lg font-black leading-tight">{brand.title}</h1>
            </div>
          )}
        </div>
        {!compact && onToggle && (
          <button onClick={onToggle} className="rounded-xl p-2 text-zinc-400 hover:bg-white/10">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {compact && onToggle && (
        <button onClick={onToggle} className="mx-auto mb-4 rounded-xl p-2 text-zinc-400 hover:bg-white/10">
          <ChevronRight size={18} />
        </button>
      )}

      {/* ── Badge type (sidebar étendue) ── */}
      {!compact && establishmentType && establishmentType !== "SUPER_ADMIN" && (
        <div className="mb-4 flex justify-center">
          <EstablishmentTypeBadge type={establishmentType} />
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavClick}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? "bg-gold text-ink shadow-lg shadow-gold/20"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              } ${compact ? "justify-center" : ""}`
            }
            title={t(item.id) || item.label}
          >
            <item.icon size={19} className="shrink-0" />
            {!compact && (
              <>
                <span>{t(item.id) || item.label}</span>
                {(item.path === "/admin/orders" ? activeOrdersCount > 0 : item.badge) && (
                  <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                    {item.path === "/admin/orders" ? activeOrdersCount : item.badge}
                  </span>
                )}
              </>
            )}
            {compact && item.path === "/admin/orders" && activeOrdersCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="mt-4 shrink-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
        {!compact ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {roleLabels[user?.roleName] || "Equipe"}
            </p>
            <p className="mt-2 truncate text-sm text-zinc-300">{brand.footer}</p>
            {establishmentType && establishmentType !== "SUPER_ADMIN" && (
              <p className="mt-1 text-xs text-zinc-500">
                {t("mode_label")} : {establishmentTypeLabels[establishmentType] || establishmentType}
              </p>
            )}
            {/* Changeur de langue inline dans sidebar mobile */}
            <div className="mt-3 flex items-center gap-1">
              {["fr", "en", "ar"].map((lng) => (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  className={`flex-1 rounded-xl py-1 text-xs font-bold uppercase transition ${
                    language === lng
                      ? "bg-gold text-ink"
                      : "text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
            {/* Thème dans sidebar mobile */}
            <button
              onClick={toggleTheme}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
            </button>
            {/* Déconnexion dans sidebar mobile */}
            <button
              onClick={onLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 py-2 text-xs font-bold text-danger hover:bg-danger hover:text-white transition"
            >
              <LogOut size={14} />
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <p className="mb-2 text-center text-xs font-black text-gold">PRO</p>
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center rounded-xl p-2 text-danger hover:bg-danger hover:text-white transition"
              title={t("logout")}
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── AdminShell principal ──────────────────────────────────────────────────────
export const AdminShell = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const sidebarCompact = useAppStore((s) => s.sidebarCompact);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);

  // Sidebar mobile (overlay)
  const [mobileOpen, setMobileOpen] = useState(false);

  const { modules: moduleAccess } = useModuleAccess(user, user?.establishmentId);
  const { establishmentType, setEstablishmentType, refetch } = useEstablishmentType(user);
  const navigation = getNavigationForRole(user?.roleName, moduleAccess, establishmentType);

  const { data: orders } = useApiResource(user ? "/orders" : null);
  const activeOrdersCount = orders.filter((o) =>
    ["NEW", "CONFIRMED", "PREPARING", "READY"].includes(o.status)
  ).length;

  const initials = (user?.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Écoute changement de mode établissement (depuis SettingsPage)
  useEffect(() => {
    const handler = (e) => {
      const { type, establishmentId } = e.detail || {};
      if (type && (user?.roleName === "SUPER_ADMIN" || establishmentId === user?.establishmentId)) {
        setEstablishmentType(type);
      }
    };
    window.addEventListener("establishment-type-changed", handler);
    return () => window.removeEventListener("establishment-type-changed", handler);
  }, [user?.establishmentId, user?.roleName, setEstablishmentType, refetch]);

  // Fermer sidebar mobile au changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Thème
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Langue
  useEffect(() => {
    changeAppLanguage(language);
  }, [language, i18n]);

  // Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  const sidebarProps = {
    navigation,
    user,
    establishmentType,
    activeOrdersCount,
    t,
    i18n,
    language,
    setLanguage,
    theme,
    toggleTheme,
    onLogout: handleLogout
  };

  return (
    <div className="min-h-screen bg-cream text-ink transition-colors dark:bg-[#09090b] dark:text-cream">

      {/* ══ SIDEBAR DESKTOP ══════════════════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-ink text-cream shadow-premium transition-all duration-300 lg:flex lg:flex-col ${
          sidebarCompact ? "w-20" : "w-[19.5rem]"
        }`}
      >
        <SidebarContent
          {...sidebarProps}
          compact={sidebarCompact}
          onToggle={toggleSidebar}
          onNavClick={undefined}
        />
      </aside>

      {/* ══ SIDEBAR MOBILE OVERLAY ════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[22rem] overflow-y-auto bg-ink text-cream shadow-premium lg:hidden"
            >
              {/* Bouton fermer */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-xl p-2 text-zinc-400 hover:bg-white/10"
              >
                <X size={20} />
              </button>
              <SidebarContent
                {...sidebarProps}
                compact={false}
                onToggle={undefined}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ CONTENU PRINCIPAL ════════════════════════════════════════════════ */}
      <div className={`${sidebarCompact ? "lg:ps-20" : "lg:ps-[19.5rem]"} transition-all duration-300`}>

        {/* ── Header sticky ── */}
        <header className="sticky top-0 z-20 border-b border-black/5 bg-cream/90 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#09090b]/90 md:px-6 md:py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white/80 text-ink shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-cream lg:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>

            {/* Recherche (desktop) */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden h-11 min-w-0 max-w-md flex-1 items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm font-semibold text-elegant shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/10 md:flex"
            >
              <Search size={18} className="shrink-0" />
              <span className="truncate">{t("global_search")}</span>
              <span className="ml-auto rounded-lg bg-black/5 px-2 py-1 text-xs dark:bg-white/10">Ctrl K</span>
            </button>

            {/* Actions droite */}
            <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 md:gap-2">
              {/* Création rapide — masqué sur très petit écran */}
              <Button
                variant="gold"
                icon={Plus}
                className="hidden sm:inline-flex"
                onClick={() => setCommandOpen(true)}
                title={t("quick_create")}
              >
                <span className="hidden md:inline">{t("quick_create")}</span>
              </Button>

              {/* Notifications */}
              <NotificationCenter />

              {/* Thème */}
              <button
                onClick={toggleTheme}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/10"
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Langue (desktop uniquement) */}
              <div className="hidden items-center gap-1 rounded-2xl border border-black/10 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/10 lg:flex">
                <Globe2 size={14} className="ms-1.5 text-elegant" />
                {["fr", "en", "ar"].map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setLanguage(lng)}
                    className={`rounded-xl px-2 py-1 text-xs font-bold uppercase transition ${
                      language === lng
                        ? "bg-ink text-cream dark:bg-gold dark:text-ink"
                        : "text-elegant hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {lng}
                  </button>
                ))}
              </div>

              {/* Profil utilisateur (desktop) */}
              <div className="hidden items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 md:flex">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-copper text-sm font-black text-white">
                  {initials}
                </div>
                <div className="hidden min-w-0 leading-tight lg:block">
                  <p className="truncate text-sm font-bold">{user?.name || "Utilisateur"}</p>
                  <p className="text-xs text-elegant">{roleLabels[user?.roleName] || "Equipe"}</p>
                </div>
              </div>

              {/* Déconnexion (desktop) */}
              <button
                onClick={handleLogout}
                className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white/80 text-danger shadow-sm transition hover:border-danger hover:bg-danger hover:text-white dark:border-white/10 dark:bg-white/10 sm:grid"
                title={t("logout")}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Contenu page ── */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-3 sm:p-4 md:p-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette />
    </div>
  );
};
