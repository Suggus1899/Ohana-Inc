const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';

function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export type UserRole = 'admin' | 'operator' | 'propietario' | 'cliente' | 'estudiante';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phonePrefix: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  dateOfBirth?: string;
  gender?: string;
  isVerified: boolean;
  accountStatus: AccountStatus;
  verifiedById?: number;
  profilePhotoUrl?: string;
  idDocumentUrl?: string;
  proofOfAddressUrl?: string;
  address?: string;
  status: 'active' | 'blocked' | 'suspended';
  statusReason?: string | null;
  suspendedUntil?: string | null;
  avgRatingAsOwner?: number;
  reviewCountAsOwner?: number;
  avgRatingAsTenant?: number;
  reviewCountAsTenant?: number;
  tutorialCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentUser extends User {
  rentalRequests?: Array<{
    id: number;
    status: string;
    property?: {
      id: number;
      title: string;
      address?: string;
      price: number;
      images?: string[];
      type?: string;
    };
  }>;
  propertyAssignments?: Array<{
    id: number;
    property?: {
      id: number;
      title: string;
      address?: string;
      price: number;
      images?: string[];
      type?: string;
    };
  }>;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  priceType: 'monthly' | 'daily';
  priceRate?: 'trm';
  bedrooms: number;
  bathrooms: number;
  roomsWithBathroom?: number;
  outsideBathrooms?: number;
  area: number;
  type: string;
  furnished: boolean;
  listingType: string;
  location: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  availableRooms?: number;
  occupiedRooms?: number;
  lat: number;
  lng: number;
  features: string[];
  images: string[];
  mainImage?: string;
  views: number;
  isFeatured: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'rented' | 'sold';
  authorId: number;
  author?: User;
  moderatorId?: number;
  rejectionReason?: string;
  videoUrl?: string;
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyReview {
  id: number;
  propertyId: number;
  userId: number;
  author?: User;
  property?: Property;
  rating: number;
  comment?: string;
  rentRequestId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserReview {
  id: number;
  reviewerId: number;
  reviewer?: User;
  reviewedId: number;
  reviewed?: User;
  rating: number;
  comment?: string;
  transactionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertyFilters {
  bedrooms?: number | string;
  furnished?: boolean;
  location?: string;
  features?: string | string[];
  status?: string;
}

export interface ModerationStats {
  today: {
    propertiesModerated: number;
    propertiesApproved: number;
    propertiesRejected: number;
    usersVerified: number;
    resolvedTickets: number;
    totalActions: number;
  };
  pending: {
    tasks: number;
    properties: number;
    verifications: number;
    tickets: number;
    reports: number;
    total: number;
  };
}

export interface SupportTicket {
  id: number;
  userId: number;
  user?: User;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  moderatorId: number | null;
  moderator?: User;
  moderatorReply: string | null;
  escalationReason?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserReport {
  id: number;
  reporterId: number;
  reporter?: User;
  reportedUserId: number;
  reportedUser?: User;
  reason: 'scam' | 'inappropriate_content' | 'harassment' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'dismissed' | 'resolved';
  moderatorId: number | null;
  moderator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  icon: string;
  category: 'basic' | 'premium' | 'amenity';
  isActive: boolean;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  property: Property;
  createdAt: string;
}

export interface RentalRequest {
  id: number;
  tenantId: number;
  tenant?: User;
  propertyId: number;
  property: Property;
  ownerId: number;
  owner?: User;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled' | 'payment_submitted' | 'completed';
  message: string;
  moveInDate: string;
  leaseDuration: number;
  respondedAt?: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  totalActions: number;
  actionsByType: { action: string; count: number }[];
  topProperties: { propertyId: number; views: number; property: Property }[];
  topSearchTerms: { query: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

export interface ConversionStats {
  views: number;
  requests: number;
  conversionRate: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: 'all' | 'clients' | 'operators' | 'owners';
  status: 'active' | 'draft' | 'expired';
  createdById: number;
  createdBy?: { id: number; name: string; email: string };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totals: {
    users: number;
    properties: number;
    requests: number;
    pendingTickets: number;
    operators: number;
    pendingProperties: number;
    approvedProperties: number;
    activeAnnouncements: number;
  };
  growth: {
    usersThisMonth: number;
    usersLastMonth: number;
    userGrowthPercent: number;
    propertiesThisMonth: number;
  };
  recentUsers: User[];
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  entity: string;
  entityId: number | string;
  changes: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  propertyId?: number;
  property?: Property;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'transaction' | 'message' | 'kyc' | 'system' | 'property' | 'review';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId: number;
  assignedTo?: User;
  assignedById: number;
  assignedBy?: User;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Always check localStorage on construction
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Initialize headers without default Content-Type
    const headers: HeadersInit = { ...options.headers };

    // Set Content-Type to application/json only if body is not FormData
    if (!(options.body instanceof FormData) && !('Content-Type' in (headers as Record<string, string>))) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    // Add Authorization header - only if NOT login/register/password-reset and token exists
    const NO_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/request-password-reset', '/auth/verify-reset-code', '/auth/reset-password', '/auth/send-verification-code', '/auth/verify-email', '/auth/google/complete'];
    const isAuthEndpoint = NO_AUTH_ENDPOINTS.some(ep => endpoint.includes(ep));
    
    if (!isAuthEndpoint) {
      const currentToken = this.token || localStorage.getItem('token');
      if (currentToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
      }
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Dispatch global auth expired event on 401 (login/register expect 401 on bad credentials so skip)
      if (response.status === 401 && !isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { endpoint, message: data?.error?.message || 'Sesión expirada' } }));
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' },
      };
    }
  }

  async getModerationStats() {
    return this.request<ModerationStats>('/moderation/stats');
  }

  async getAdminStats() {
    return this.request<AdminStats>('/moderation/admin/stats');
  }

  async getSettings() {
    return this.request<{ settings: Record<string, any> }>('/settings');
  }

  async updateSettings(settings: Record<string, any>) {
    return this.request<{ settings: Record<string, any> }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: Record<string, unknown>) {
    return this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  // Password Reset
  async requestPasswordReset(email: string) {
    return this.request<{ message: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetCode(email: string, code: string) {
    return this.request<{ valid: boolean; message: string }>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  // Email Verification
  async sendVerificationCode(email: string, name?: string) {
    return this.request<{ message: string }>('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async verifyEmailCode(email: string, code: string) {
    return this.request<{ message: string; emailVerified: boolean; token?: string; user?: User }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  // Google Auth
  async completeGoogleRegistration(tempToken: string, data: {
    role: string; phonePrefix: string; phone: string;
    cedulaType: string; cedula: string; dateOfBirth?: string; gender?: string;
  }) {
    const res = await this.request<{ user: User; token: string }>('/auth/google/complete', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${tempToken}` } as HeadersInit,
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error completando registro');
    return res.data;
  }

  async getUsers(filters: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value.toString());
    });
    return this.request<{ users: User[]; pagination: Pagination }>(`/users?${query.toString()}`);
  }

  async getUserById(userId: number) {
    return this.request<{ user: User }>(`/users/${userId}`);
  }

  async getStudentsList() {
    return this.request<{ users: StudentUser[] }>('/users/students');
  }

  async verifyUser(userId: number, isVerified: boolean) {
    return this.request<{ user: User }>(`/users/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified }),
    });
  }

  async updateUserStatus(userId: number, status: 'active' | 'pending' | 'suspended' | 'rejected' | 'blocked') {
    return this.request<{ user: User }>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateUserRole(userId: number, role: string) {
    return this.request<{ user: User }>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async createUser(userData: Record<string, unknown>) {
    return this.request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: Record<string, unknown>) {
    return this.request<{ user: User }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async approveUser(userId: number, reason?: string) {
    return this.request<{ user: User }>(`/users/${userId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async rejectUser(userId: number, reason?: string) {
    return this.request<{ user: User }>(`/users/${userId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async suspendUser(userId: number, reason?: string, suspendedUntil?: string) {
    return this.request<{ user: User }>(`/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, suspendedUntil }),
    });
  }

  async reactivateUser(userId: number, reason?: string) {
    return this.request<{ user: User }>(`/users/${userId}/reactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getProperty(id: number | string) {
    return this.request<{ property: Property }>(`/properties/${id}`, {
      headers: { 'x-session-id': getSessionId() } as HeadersInit,
    });
  }

  async getProperties(filters: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query.append(key, value.toString());
      }
    });

    return this.request<{ properties: Property[]; pagination: Pagination }>(`/properties?${query.toString()}`);
  }

  async getZones(params: { lat?: number; lng?: number; radius?: number } = {}) {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.append('lat', String(params.lat));
    if (params.lng !== undefined) query.append('lng', String(params.lng));
    if (params.radius !== undefined) query.append('radius', String(params.radius));
    return this.request<{ zones: string[] }>(`/properties/zones?${query.toString()}`);
  }

  async getLocationSuggestions(q: string) {
    return this.request<{ suggestions: Array<{ label: string; sublabel: string; address: string; city: string; count: number }> }>(
      `/properties/location-suggestions?q=${encodeURIComponent(q)}`
    );
  }

  async getPropertyCountsByType() {
    return this.request<{ counts: { type: string; count: number }[] }>('/properties/counts/by-type');
  }

  async updatePropertyStatus(id: number | string, status: string, reason?: string) {
    return this.request<{ property: Property }>(`/properties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async assignModerator(propertyId: number | string, moderatorId: number) {
    return this.request<{ message: string; property: Property }>(`/properties/${propertyId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ moderatorId }),
    });
  }

  async getTickets(filters: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query.append(key, value.toString());
      }
    });
    return this.request<SupportTicket[]>(`/tickets?${query.toString()}`);
  }

  async updateTicket(id: number | string, data: Partial<SupportTicket>) {
    return this.request<SupportTicket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createTicket(data: { subject: string; description?: string; message?: string; priority?: string; category?: string }) {
    return this.request<SupportTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAvailableOperators() {
    return this.request<{
      operators: Array<{ id: number; name: string; email: string; profilePhotoUrl?: string; role: string }>;
      onlineIds: number[];
    }>('/chat/available-operators');
  }

  async getReports(filters: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query.append(key, value.toString());
      }
    });
    return this.request<UserReport[]>(`/reports?${query.toString()}`);
  }

  async updateReportStatus(id: number | string, status: 'dismissed' | 'resolved') {
    return this.request<UserReport>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Favorite methods
  async toggleFavorite(propertyId: number) {
    return this.request<{ isFavorite: boolean }>('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
  }

  async getFavorites() {
    return this.request<{ favorites: Favorite[] }>('/favorites');
  }

  // Rent Request methods
  async createVisit(data: { propertyId: number; name: string; email: string; phone: string; visitDate: string; message?: string }) {
    return this.request<{ visit: any }>('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOwnerVisits() {
    return this.request<{ visits: any[] }>('/visits/owner/all');
  }

  async updateVisitStatus(visitId: number, status: string, scheduledTime?: string) {
    return this.request<{ visit: any }>(`/visits/${visitId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, scheduledTime }),
    });
  }

  async createRentRequest(data: { propertyId: number; message: string; moveInDate?: string; phoneNumber?: string; leaseDuration?: number }) {
    return this.request<{ request: RentalRequest }>('/rent-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserRentRequests() {
    return this.request<{ requests: RentalRequest[] }>('/rent-requests');
  }

  async getReceivedRentRequests() {
    return this.request<{ requests: RentalRequest[] }>('/rent-requests/received');
  }

  async updateRentRequestStatus(id: number | string, status: 'accepted' | 'rejected' | 'cancelled') {
    return this.request<{ request: RentalRequest }>(`/rent-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Task methods
  async getTasks(filters?: { status?: string; priority?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    return this.request<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
  }

  async updateTaskStatus(id: number | string, status: string) {
    return this.request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getServices(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<Service[]>(`/services${query}`);
  }

  async createService(data: Partial<Service>) {
    return this.request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: Partial<Service>) {
    return this.request<Service>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPropertyTypeCounts() {
    return this.request<{ type: string; count: number }[]>('/statistics/property-type-counts');
  }

  async getServicePropertyCounts() {
    return this.request<{ serviceId: number; count: number }[]>('/statistics/service-property-counts');
  }

  async getAnalyticsDashboard(timeRange: 'today' | '7d' | '30d' = '30d') {
    return this.request<AnalyticsDashboard>(`/analytics/dashboard?timeRange=${timeRange}`);
  }

  async getConversionStats() {
    return this.request<ConversionStats>('/analytics/conversion');
  }

  async getAuditLogs(filters: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query.append(key, value.toString());
      }
    });
    return this.request<{ logs: AuditLog[]; pagination: Pagination }>(`/audit?${query.toString()}`);
  }

  async getConversations() {
    return this.request<Conversation[]>('/messages/conversations');
  }

  async getChatHistory(otherUserId: number | string) {
    return this.request<Message[]>(`/messages/chat/${otherUserId}`);
  }

  async sendMessage(receiverId: number | string, content: string, propertyId?: number | string) {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, propertyId }),
    });
  }

  // KYC methods
  async startKYCVerification() {
    return this.request<{ verificationId: number; status: string; currentStep: string }>('/kyc/start', {
      method: 'POST',
    });
  }

  async uploadKYCDocument(verificationId: number, documentType: string, file: Blob) {
    const formData = new FormData();
    formData.append('verificationId', verificationId.toString());
    formData.append('documentType', documentType);
    formData.append('file', file, `${documentType}.jpg`);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const url = `${this.baseUrl}/kyc/upload`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: { code: 'UPLOAD_ERROR', message: 'Failed to upload document' },
      };
    }
  }

  async processKYCVerification(verificationId: number) {
    return this.request<{
      status: string;
      ocrData?: Record<string, unknown>;
      scores?: {
        faceMatch: number;
        liveness: number;
        documentValidity: number;
        fraud: number;
      };
    }>(`/kyc/process/${verificationId}`, {
      method: 'POST',
    });
  }

  async getKYCStatus() {
    return this.request<{
      verificationId: number;
      status: string;
      verificationLevel: number;
      createdAt: string;
      updatedAt: string;
      expiresAt?: string;
    }>('/kyc/status');
  }

  async getPendingKYCVerifications(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    fraudScoreMin?: number;
    fraudScoreMax?: number;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request<{
      verifications: Record<string, unknown>[];
      total: number;
      page: number;
      limit: number;
    }>(`/kyc/admin/pending?${params.toString()}`);
  }

  async getKYCVerificationDetails(verificationId: number) {
    return this.request<{
      verification: Record<string, unknown>;
      documents: Record<string, unknown>[];
      attempts: Record<string, unknown>[];
      user: Record<string, unknown>;
    }>(`/kyc/admin/${verificationId}`);
  }

  async approveKYCVerification(verificationId: number, notes?: string) {
    return this.request<{
      verificationId: number;
      status: string;
      verifiedAt: string;
    }>(`/kyc/admin/approve/${verificationId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectKYCVerification(verificationId: number, reason: string) {
    return this.request<{
      verificationId: number;
      status: string;
      rejectionReason: string;
    }>(`/kyc/admin/reject/${verificationId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

// Chat methods
  async getChatConversations() {
    return this.request<{ conversations: Record<string, unknown>[] }>('/chat/conversations');
  }

  async getChatMessages(conversationId: number, page = 1, limit = 50) {
    return this.request<{
      messages: Record<string, unknown>[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  async createChatConversation(rentRequestId: number) {
    return this.request<{ conversation: Record<string, unknown> }>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ rentRequestId }),
    });
  }

  async createDirectChatConversation(otherUserId: number) {
    return this.request<{ conversation: Record<string, unknown> }>('/chat/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
  }

  async searchUsersForChat(query: string) {
    return this.request<{ users: Record<string, unknown>[] }>(`/chat/search-users?query=${encodeURIComponent(query)}`);
  }

  async acceptChatRequest(conversationId: number) {
    return this.request<{ conversation: Record<string, unknown> }>(`/chat/conversations/${conversationId}/accept`, { method: 'POST' });
  }

  async rejectChatRequest(conversationId: number) {
    return this.request<void>(`/chat/conversations/${conversationId}/reject`, { method: 'POST' });
  }

  async blockUser(userId: number) {
    return this.request<void>('/chat/blocks', { method: 'POST', body: JSON.stringify({ userId }) });
  }

  async unblockUser(userId: number) {
    return this.request<void>('/chat/blocks', { method: 'DELETE', body: JSON.stringify({ userId }) });
  }

  async getBlockedUsers() {
    return this.request<{ blocks: Record<string, unknown>[] }>('/chat/blocks');
  }

  async deleteMessage(messageId: number) {
    return this.request<void>(`/chat/messages/${messageId}`, { method: 'DELETE' });
  }

  async deleteConversationForMe(conversationId: number) {
    return this.request<void>(`/chat/conversations/${conversationId}`, { method: 'DELETE' });
  }

  async getChatAvailableUsers(query: string) {
    return this.request<{ users: Record<string, unknown>[] }>(`/chat/available-users?query=${encodeURIComponent(query)}`);
  }

  async getChatUnreadCount() {
    return this.request<{ unreadCount: number }>('/chat/unread-count');
  }

  // ─── Reviews (Puntuación y Comentarios) ────────────────────────────────────

  async createPropertyReview(data: {
    propertyId: number;
    rating: number;
    comment?: string;
    rentRequestId?: number;
  }) {
    return this.request<{ review: PropertyReview }>('/reviews/property', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPropertyReviews(propertyId: number, page = 1, limit = 10) {
    return this.request<{
      reviews: PropertyReview[];
      pagination: Pagination;
      avgRating: number;
      reviewCount: number;
    }>(`/reviews/property/${propertyId}?page=${page}&limit=${limit}`);
  }

  async getMyPropertyReview(propertyId: number) {
    return this.request<{ review: PropertyReview | null }>(
      `/reviews/property/${propertyId}/my`
    );
  }

  async updatePropertyReview(id: number, data: { rating?: number; comment?: string }) {
    return this.request<{ review: PropertyReview }>(`/reviews/property/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePropertyReview(id: number) {
    return this.request<{ message: string }>(`/reviews/property/${id}`, {
      method: 'DELETE',
    });
  }

  async createUserReview(data: {
    reviewedId: number;
    rating: number;
    comment?: string;
    transactionId?: number;
  }) {
    return this.request<{ review: UserReview }>('/reviews/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserReviews(userId: number, page = 1, limit = 10, role?: 'owner' | 'tenant') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.append('role', role);
    return this.request<{
      reviews: UserReview[];
      pagination: Pagination;
      avgRating: number;
      reviewCount: number;
    }>(`/reviews/user/${userId}?${params.toString()}`);
  }

  async getOwnerPropertiesReviews(ownerId: number, page = 1, limit = 10) {
    return this.request<{
      reviews: PropertyReview[];
      pagination: Pagination;
    }>(`/reviews/owner-properties/${ownerId}?page=${page}&limit=${limit}`);
  }

  async getUserReviewBetween(userId: number) {
    return this.request<{ review: UserReview | null }>(
      `/reviews/user/${userId}/between`
    );
  }

  async updateUserReview(id: number, data: { rating?: number; comment?: string }) {
    return this.request<{ review: UserReview }>(`/reviews/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUserReview(id: number) {
    return this.request<{ message: string }>(`/reviews/user/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Metrics / Behavior Tracking ───────────────────────────────────────────

  async trackBatch(events: Record<string, unknown>[]) {
    return this.request<void>('/metrics/track-batch', {
      method: 'POST',
      body: JSON.stringify(events),
    });
  }

  async startSession(osDevice?: string) {
    return this.request<{ sessionId: number }>('/metrics/session/start', {
      method: 'POST',
      body: JSON.stringify({ osDevice }),
    });
  }

  async endSession(sessionId: number) {
    return this.request<{ sessionId: number; durationSeconds: number }>('/metrics/session/end', {
      method: 'PUT',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getBehaviorSummary() {
    return this.request<{
      topSearches: Array<{ term: string; count: number }>;
      averageSessionDurationSeconds: number;
      topZones: Array<{ zone: string; count: number }>;
      eventDistribution: Array<{ eventType: string; count: number; percentage: number }>;
      generatedAt: string;
    }>('/metrics/operator/behavior-summary');
  }

  async getTrendingSearches() {
    return this.request<{
      trending: Array<{ term: string; count: number }>;
      month: string;
    }>('/metrics/operator/trending-searches');
  }

  async getSessionFrequency(days = 30) {
    return this.request<{
      frequency: Array<{ date: string; sessions: number }>;
      days: number;
    }>(`/metrics/operator/session-frequency?days=${days}`);
  }

  // ─── Payment Info ──────────────────────────────────────────────────────────

  async getUserPaymentInfo(userId: number) {
    return this.request<{
      name: string;
      paymentInfo: {
        bankName: string | null;
        bankAccountNumber: string | null;
        bankAccountHolder: string | null;
        bankAccountType: string | null;
        bankPhone: string | null;
        bankPhoneId: string | null;
        bankPhoneName: string | null;
      };
    }>(`/users/${userId}/payment-info`);
  }

  async updateMyPaymentInfo(data: {
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    bankAccountType?: string | null;
    bankPhone?: string | null;
    bankPhoneId?: string | null;
    bankPhoneName?: string | null;
  }) {
    return this.request<{ user: Record<string, unknown> }>('/users/me/payment-info', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── KYC Document Viewer ───────────────────────────────────────────────────

  async viewDocument(documentId: number): Promise<Blob> {
    const url = `${this.baseUrl}/kyc/admin/documents/${documentId}/view`;
    const headers: HeadersInit = {};
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return response.blob();
  }

  async getMyVerificationLevel() {
    const res = await this.request<{
      verificationLevel: number;
      kycStatus?: string;
      isVerified: boolean;
      canRequestProperty: boolean;
    }>('/users/me/verification-level');
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error obteniendo nivel de verificación');
    return res.data;
  }

  // ─── Properties (owner) ────────────────────────────────────────────────────

  async createPropertyWithMedia(formData: FormData) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${this['baseUrl']}/properties`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Error creando propiedad');
    return json.data as { property: Property };
  }

  async getMyProperties(page = 1, limit = 12) {
    const res = await this.request<{ properties: Property[]; total: number; page: number; pages: number }>(
      `/properties/my?page=${page}&limit=${limit}`
    );
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error cargando propiedades');
    return res.data;
  }

  async publishProperty(propertyId: number) {
    const res = await this.request<{ property: Property }>(`/properties/${propertyId}/publish`, {
      method: 'POST',
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error publicando propiedad');
    return res.data;
  }

  async updateProperty(id: number | string, data: Partial<Property>) {
    const res = await this.request<{ property: Property }>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error actualizando propiedad');
    return res.data;
  }

  async deleteProperty(id: number | string) {
    const res = await this.request<{ message: string }>(`/properties/${id}`, {
      method: 'DELETE',
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Error eliminando propiedad');
    return res.data;
  }

  // ─── Profile & Preferences ─────────────────────────────────────────────────

  async updateProfile(data: { name?: string; phone?: string; dateOfBirth?: string; gender?: string }) {
    const res = await this.request<{ user: { id: number; name: string; phone: string; dateOfBirth?: string; gender?: string } }>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error actualizando perfil');
    return res.data;
  }

  async changePassword(data: { currentPassword?: string; newPassword: string }) {
    const res = await this.request<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error cambiando contraseña');
    return res.data;
  }

  async updatePreferences(data: { emailNotifications?: boolean; whatsappNotifications?: boolean }) {
    const res = await this.request<{ preferences: { emailNotifications: boolean; whatsappNotifications: boolean } }>('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Error actualizando preferencias');
    return res.data;
  }

  async markTutorialCompleted() {
    const res = await this.request<{ message: string }>('/users/me/tutorial-completed', {
      method: 'PUT',
    });
    if (!res.success) throw new Error(res.error?.message ?? 'Error al marcar tutorial completado');
    return res.data;
  }

  // Announcements
  async getAnnouncements(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return this.request<{ announcements: Announcement[]; total: number; page: number; limit: number; totalPages: number }>(`/announcements${qs ? `?${qs}` : ''}`);
  }

  async createAnnouncement(data: { title: string; content: string; targetAudience?: string; status?: string; expiresAt?: string }) {
    return this.request<{ announcement: Announcement }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: number, data: Partial<{ title: string; content: string; targetAudience: string; status: string; expiresAt: string }>) {
    return this.request<{ announcement: Announcement }>(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: number) {
    return this.request<{ message: string }>(`/announcements/${id}`, { method: 'DELETE' });
  }

  async publishAnnouncement(id: number) {
    return this.request<{ announcement: Announcement }>(`/announcements/${id}/publish`, { method: 'POST' });
  }

  async getStatisticsOverview(timeRange?: number) {
    const q = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request<{
      users: { total: number; active: number; new: number; growth: number };
      properties: { total: number; active: number; pending: number; growth: number };
    }>(`/statistics/overview${q}`);
  }

  async getStatisticsTrends(timeRange?: number) {
    const q = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request<{
      topSearches: { term: string; count: number }[];
      hourlyActivity: { hour: number; activity: number }[];
      propertyTypes: { type: string; count: number; percentage: number }[];
    }>(`/statistics/trends${q}`);
  }

  // Notifications
  async getNotifications(page = 1, limit = 20) {
    return this.request<{
      notifications: Notification[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadNotificationCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: number) {
    return this.request<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ message: string }>('/notifications/read-all', { method: 'POST' });
  }

  async deleteNotification(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
