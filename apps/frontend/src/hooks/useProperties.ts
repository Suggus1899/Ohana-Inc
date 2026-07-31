import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Property, ApiResponse } from '../services/types';

/**
 * TanStack Query hooks for property data.
 *
 * These replace the useEffect + useState pattern used in multiple
 * components (Index.tsx, DiscoverSection.tsx, PropertyDetail.tsx),
 * providing automatic caching, refetching, and stale-while-revalidate.
 */

export interface PropertyListFilters {
  search?: string;
  type?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  furnished?: string;
  location?: string;
  page?: number;
  limit?: number;
  lat?: string;
  lng?: string;
  radius?: string;
  features?: string;
  services?: string;
}

export function useProperties(filters: PropertyListFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params[key] = value;
      });
      const response = await api.getProperties(params);
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProperty(id: number | string | undefined) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.getProperty(id!);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMyProperties(page = 1, limit = 12) {
  return useQuery({
    queryKey: ['my-properties', page, limit],
    queryFn: async () => {
      const response = await api.getMyProperties(page, limit);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: number | string; status: string; reason?: string }) => {
      const response = await api.updatePropertyStatus(id, status, reason);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });
}
