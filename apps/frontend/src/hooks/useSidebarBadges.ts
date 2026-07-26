import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { socketService } from '@/services/socket';

export interface SidebarBadges {
  [sectionId: string]: number;
}

export const useSidebarBadges = (role: string): SidebarBadges => {
  const [badges, setBadges] = useState<SidebarBadges>({});

  const fetchBadges = useCallback(async () => {
    try {
      // Single consolidated endpoint replaces 2-3 per-role API calls
      const res = await api.request<Record<string, number>>('/notifications/badge-counts');
      if (res.success && res.data) {
        const data = res.data;
        const normalizedRole = role.toLowerCase();

        if (normalizedRole === 'admin') {
          setBadges({
            kyc: data.pendingKYC || 0,
            reports: data.pendingReports || 0,
            announcements: data.draftAnnouncements || 0,
          });
        } else if (normalizedRole === 'operator') {
          setBadges({
            verifications: data.pendingVerifications || 0,
            reviews: data.pendingReviews || 0,
            'properties-review': data.pendingReviews || 0,
            support: data.pendingSupport || 0,
            reports: data.pendingReports || 0,
            tasks: data.pendingTasks || 0,
          });
        } else if (normalizedRole === 'owner' || normalizedRole === 'propietario') {
          setBadges({
            messages: data.unreadMessages || 0,
            requests: data.pendingRequests || 0,
          });
        } else {
          // client/estudiante/default
          setBadges({
            messages: data.unreadMessages || 0,
            requests: data.activeRequests || 0,
            notifications: data.unreadNotifications || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch sidebar badges', error);
    }
  }, [role]);

  useEffect(() => {
    // Initial fetch
    fetchBadges();

    // Listen for socket badge updates
    const unsubBadge = socketService.on('badge:update', () => {
      // Refetch full badges to get role-specific counts
      fetchBadges();
    });

    // Listen for transaction events that may change badge counts
    const txEvents = [
      'transaction:new_request', 'transaction:approved', 'transaction:rejected',
      'transaction:payment_submitted', 'transaction:payment_confirmed',
      'transaction:cancelled', 'transaction:expired',
      'dispute:new', 'dispute:resolved',
    ];
    const unsubscribers = txEvents.map(event =>
      socketService.on(event, () => fetchBadges())
    );

    // Ensure socket is connected
    socketService.connect();

    // Fallback polling at 60s (instead of 10-30s per-role)
    const fallbackInterval = setInterval(fetchBadges, 60000);

    return () => {
      clearInterval(fallbackInterval);
      unsubBadge();
      unsubscribers.forEach(u => u());
    };
  }, [role, fetchBadges]);

  return badges;
};
