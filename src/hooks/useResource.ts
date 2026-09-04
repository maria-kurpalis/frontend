import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrors } from '../services/http';
import type { FieldError } from '../types/moveRequest';

export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setErrors([]);
    try {
      const result = await loader();
      if (current === generation.current) setData(result);
      return true;
    } catch (error) {
      if (current === generation.current) setErrors(apiErrors(error));
      return false;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);
  return { data, errors, loading, refresh };
}
