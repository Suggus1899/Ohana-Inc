/**
 * Mock API interceptor for Demo Mode.
 *
 * When `localStorage.getItem('demoMode') === 'true'`, the ApiService delegates
 * calls here instead of making real HTTP requests. Only the methods needed to
 * render every dashboard are implemented; the rest fall back to a generic
 * empty-success response so the UI doesn't crash.
 */
import {
  demoUsers,
  demoUserByRole,
  demoProperties,
  demoRentalRequests,
  demoTickets,
  demoFavorites,
  demoAnnouncements,
  demoAdminStats,
  demoModerationStats,
  mockDelay,
} from './mockData';
import type {
  User,
  Property,
  RentalRequest,
  SupportTicket,
  Favorite,
  Announcement,
  AdminStats,
  ModerationStats,
  ApiResponse,
  Pagination,
} from './api';

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function currentDemoUser(): User {
  const role = (localStorage.getItem('demoRole') as User['role']) || 'cliente';
  return demoUserByRole[role] ?? demoUsers[3];
}

function emptyList<T>(extra?: Partial<T>): ApiResponse<T> {
  return ok(extra ?? ({} as T));
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function mockGetCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return mockDelay(ok({ user: currentDemoUser() }));
}

export async function mockLogout(): Promise<ApiResponse<{ message: string }>> {
  return mockDelay(ok({ message: 'Logged out (demo)' }));
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export async function mockGetAdminStats(): Promise<ApiResponse<AdminStats>> {
  return mockDelay(ok(demoAdminStats));
}

export async function mockGetModerationStats(): Promise<ApiResponse<ModerationStats>> {
  return mockDelay(ok(demoModerationStats));
}

// ─── Properties ────────────────────────────────────────────────────────────

export async function mockGetProperties(
  filters?: Record<string, unknown>
): Promise<ApiResponse<{ properties: Property[]; pagination: Pagination }>> {
  let list = [...demoProperties];
  if (filters) {
    if (typeof filters.status === 'string') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (typeof filters.moderatorId === 'number') {
      list = list.filter((p) => p.moderatorId === filters.moderatorId);
    }
    if (typeof filters.authorId === 'number') {
      list = list.filter((p) => p.authorId === filters.authorId);
    }
    if (typeof filters.search === 'string') {
      const q = String(filters.search).toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }
  }
  const pagination: Pagination = {
    page: 1,
    limit: list.length,
    total: list.length,
    pages: 1,
  };
  return mockDelay(ok({ properties: list, pagination }));
}

export async function mockGetProperty(id: number): Promise<ApiResponse<{ property: Property }>> {
  const property = demoProperties.find((p) => p.id === id) ?? demoProperties[0];
  return mockDelay(ok({ property }));
}

export async function mockGetMyProperties(
  page = 1,
  limit = 12
): Promise<ApiResponse<{ properties: Property[]; total: number; page: number; pages: number }>> {
  const user = currentDemoUser();
  const list = demoProperties.filter((p) => p.authorId === user.id);
  return mockDelay(
    ok({
      properties: list,
      total: list.length,
      page,
      pages: Math.max(1, Math.ceil(list.length / limit)),
    })
  );
}

export async function mockGetPropertyTypeCounts(): Promise<ApiResponse<{ type: string; count: number }[]>> {
  const counts = demoProperties.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});
  return mockDelay(ok(Object.entries(counts).map(([type, count]) => ({ type, count }))));
}

// ─── Favorites ─────────────────────────────────────────────────────────────

export async function mockGetFavorites(): Promise<ApiResponse<{ favorites: Favorite[] }>> {
  const user = currentDemoUser();
  const list = demoFavorites.filter((f) => f.userId === user.id);
  return mockDelay(ok({ favorites: list }));
}

export async function mockToggleFavorite(
  propertyId: number
): Promise<ApiResponse<{ isFavorite: boolean }>> {
  const user = currentDemoUser();
  const exists = demoFavorites.some(
    (f) => f.userId === user.id && f.propertyId === propertyId
  );
  return mockDelay(ok({ isFavorite: !exists }));
}

// ─── Rental Requests ───────────────────────────────────────────────────────

export async function mockGetUserRentRequests(): Promise<ApiResponse<{ requests: RentalRequest[] }>> {
  const user = currentDemoUser();
  const list = demoRentalRequests.filter((r) => r.tenantId === user.id);
  return mockDelay(ok({ requests: list }));
}

export async function mockGetReceivedRentRequests(): Promise<ApiResponse<{ requests: RentalRequest[] }>> {
  const user = currentDemoUser();
  const list = demoRentalRequests.filter((r) => r.ownerId === user.id);
  return mockDelay(ok({ requests: list }));
}

// ─── Tickets ───────────────────────────────────────────────────────────────

export async function mockGetTickets(): Promise<ApiResponse<SupportTicket[]>> {
  return mockDelay(ok(demoTickets));
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function mockGetUsers(): Promise<ApiResponse<{ users: User[]; pagination: Pagination }>> {
  return mockDelay(
    ok({
      users: demoUsers,
      pagination: { page: 1, limit: demoUsers.length, total: demoUsers.length, pages: 1 },
    })
  );
}

export async function mockGetStudentsList(): Promise<ApiResponse<{ users: User[] }>> {
  const students = demoUsers.filter((u) => u.role === 'estudiante' || u.role === 'cliente');
  return mockDelay(ok({ users: students }));
}

// ─── Announcements ─────────────────────────────────────────────────────────

export async function mockGetAnnouncements(
  params?: Record<string, unknown>
): Promise<ApiResponse<{ announcements: Announcement[]; total: number }>> {
  let list = [...demoAnnouncements];
  if (params?.status) {
    list = list.filter((a) => a.status === params.status);
  }
  return mockDelay(ok({ announcements: list, total: list.length }));
}

// ─── Generic fallback ──────────────────────────────────────────────────────

/**
 * Fallback for any API method not explicitly mocked.
 * Returns a successful empty response so the UI doesn't crash.
 */
export async function mockFallback<T>(data?: T): Promise<ApiResponse<T>> {
  return mockDelay(ok(data ?? ({} as T)));
}
