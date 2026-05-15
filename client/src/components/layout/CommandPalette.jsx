import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNavigationForRole } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useModuleAccess } from "../../hooks/useModuleAccess";
import { useEstablishmentType } from "../../hooks/useEstablishmentType";
import { useAppStore } from "../../store/useAppStore";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";

export const CommandPalette = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { modules: moduleAccess } = useModuleAccess(user, user?.establishmentId);
  const { establishmentType } = useEstablishmentType(user);
  const open = useAppStore((state) => state.commandOpen);
  const setOpen = useAppStore((state) => state.setCommandOpen);
  const [query, setQuery] = useState("");

  const navigation = getNavigationForRole(user?.roleName, moduleAccess, establishmentType);
  const filtered = query.trim()
    ? navigation.filter((item) =>
        (t(item.id) || item.label).toLowerCase().includes(query.toLowerCase())
      )
    : navigation;

  const go = (path) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <Modal open={open} onClose={() => { setOpen(false); setQuery(""); }} title={t("global_search")}>
      <Input
        icon={Search}
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("global_search") + "..."}
      />
      <div className="mt-4 grid gap-1.5 max-h-72 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-elegant text-center">{t("no_data")}</p>
        )}
        {filtered.map((item) => (
          <button
            key={item.path}
            onClick={() => go(item.path)}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-ink transition hover:bg-gold/10 dark:text-cream"
          >
            <item.icon size={18} className="shrink-0 text-copper" />
            <span>{t(item.id) || item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-gold/20 px-2 py-0.5 text-xs text-copper">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
};
