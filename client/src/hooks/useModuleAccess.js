import { useEffect, useState } from "react";
import { api } from "../services/api";

export const useModuleAccess = (user, establishmentId) => {
  const [modules, setModules] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setModules(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    api.get("/settings/module-access", {
      signal: controller.signal,
      params: establishmentId ? { establishmentId } : undefined
    })
      .then(({ data }) => setModules(data.data.modules))
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") setModules(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [establishmentId, user]);

  return { modules, loading };
};
