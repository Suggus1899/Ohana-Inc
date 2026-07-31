import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

/**
 * TanStack Query hooks for admin/moderation dashboard data.
 *
 * Replaces the useEffect + useState pattern in AdminDashboard.tsx
 * and moderation components.
 */

export function useModerationStats() {
  return useQuery({
    queryKey: ['moderation-stats'],
    queryFn: async () => {
      const response = await api.getModerationStats();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.getAdminStats();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function usePropertyCountsByType() {
  return useQuery({
    queryKey: ['property-counts-by-type'],
    queryFn: async () => {
      const response = await api.getPropertyCountsByType();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
