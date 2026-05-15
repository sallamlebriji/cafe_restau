import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export const useApiResource = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async (options = {}) => {
    if (!endpoint) {
      setData([]);
      setLoading(false);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint, options);
      const items = response.data.data || [];
      setData(items);
      return items;
    } catch (requestError) {
      if (requestError.name === "CanceledError" || requestError.code === "ERR_CANCELED") return [];
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!endpoint) {
      setData([]);
      setLoading(false);
      setError(null);
      return () => {
      };
    }
    const controller = new AbortController();
    refetch({ signal: controller.signal }).catch(() => undefined);

    return () => {
      controller.abort();
    };
  }, [endpoint, refetch]);

  return { data, loading, error, setData, refetch };
};
