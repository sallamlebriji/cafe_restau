import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";

/**
 * Charge le type de l'établissement (CAFE | RESTAURANT | CAFE_RESTAURANT)
 * depuis l'API et l'expose pour filtrer la navigation.
 *
 * Pour le SUPER_ADMIN : retourne "SUPER_ADMIN" (voit tout)
 * Pour les autres : charge depuis /settings/establishment-type
 *
 * Expose aussi `refetch()` pour forcer le rechargement après mise à jour.
 */
export const useEstablishmentType = (user) => {
  const [establishmentType, setEstablishmentType] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [refreshToken, setRefreshToken] = useState(0);

  const refetch = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    if (!user) {
      setEstablishmentType(null);
      setLoading(false);
      return;
    }

    // Super Admin voit tout — pas de filtrage par type
    if (user.roleName === "SUPER_ADMIN") {
      setEstablishmentType("SUPER_ADMIN");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    api.get("/settings/establishment-type", {
      signal: controller.signal,
      params: user.establishmentId ? { establishmentId: user.establishmentId } : {}
    })
      .then(({ data }) => {
        setEstablishmentType(data.data?.type || "CAFE_RESTAURANT");
      })
      .catch((err) => {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        // Fallback : tenter depuis /establishments
        api.get("/establishments", { params: { limit: 100 } })
          .then(({ data }) => {
            const list = data.data || [];
            const current = list.find((e) => e.id === user.establishmentId) || list[0];
            setEstablishmentType(current?.type || "CAFE_RESTAURANT");
          })
          .catch(() => setEstablishmentType("CAFE_RESTAURANT"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user?.establishmentId, user?.roleName, refreshToken]);

  return { establishmentType, setEstablishmentType, loading, refetch };
};
