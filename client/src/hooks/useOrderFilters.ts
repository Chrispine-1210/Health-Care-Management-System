import { useState, useMemo } from 'react';

/**
 * Hook for client-side order filtering
 */

interface FilterState {
  status: string;
  search: string;
  sortBy: 'date' | 'amount' | 'status';
}

export function useOrderFilters(orders: any[]) {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    search: '',
    sortBy: 'date',
  });

  const filtered = useMemo(() => {
    let result = [...orders];

    // Apply status filter
    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }

    // Apply search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(query) ||
        o.customerId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filters.sortBy === 'amount') {
        return b.total - a.total;
      } else if (filters.sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return result;
  }, [orders, filters]);

  return {
    filtered,
    filters,
    setFilters,
    clearFilters: () => setFilters({ status: '', search: '', sortBy: 'date' }),
  };
}
