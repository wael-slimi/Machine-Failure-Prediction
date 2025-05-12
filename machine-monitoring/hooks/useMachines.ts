import { useState, useEffect } from 'react';
import { api, Machine } from '@/lib/api';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await api.getMachines();
        setMachines(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch machines');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  return { machines, loading, error };
} 