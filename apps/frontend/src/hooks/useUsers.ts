import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

/**
 * TanStack Query hooks for user data.
 *
 * Replaces the useEffect + useState pattern in UsersSection.tsx
 * and other admin components.
 */

export interface UserListFilters {
  role?: string;
  excludeRole?: string;
  accountStatus?: string;
  isVerified?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useUsers(filters: UserListFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params[key] = value;
      });
      const response = await api.getUsers(params);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.getStudentsList();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: 'active' | 'pending' | 'suspended' | 'rejected' | 'blocked' }) => {
      const response = await api.updateUserStatus(userId, status);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await api.updateUserRole(userId, role);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
