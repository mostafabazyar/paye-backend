export type AdminUser = {
  id: string;
  phone: string;
  name: string | null;
  birthDate: string | null;
  gender: string | null;
  interestedIn: string | null;
  preferredSports: string | null;
  preferredSessionTypes: string | null;
  bio: string | null;
  photos: string[];
  avgRating: number;
  isVerified: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UsersListResponse = {
  success: boolean;
  users: AdminUser[];
  total: number;
  skip: number;
  take: number;
};

export type UserListParams = {
  search?: string;
  isVerified?: "true" | "false";
  isBlocked?: "true" | "false";
  skip?: number;
  take?: number;
};

/* ---------- Listings (Profile) ---------- */

export type ExerciseType =
  | "GYM"
  | "YOGA"
  | "RUNNING"
  | "SWIMMING"
  | "FOOTBALL"
  | "BASKETBALL"
  | "TENNIS"
  | "CYCLING"
  | "HIKING"
  | "CROSSFIT"
  | "PILATES"
  | "DANCE"
  | "MARTIAL_ARTS"
  | "OTHER";

export type GenderPreference =
  | "MALE"
  | "FEMALE"
  | "ANY";

export type AdminProfile = {
  id: number;
  userId: string;
  exerciseType: ExerciseType;
  genderPreference: GenderPreference;
  title: string;
  location: string;
  scheduledAt: string | null;
  maxInvites: number;
  goDutch: boolean;
  moreInfo: string | null;
  tags: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ---------- Requests ---------- */

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminUserMini = {
  id: string;
  name: string | null;
  phone: string;
};

export type AdminRequest = {
  id: number;
  profileId: number;
  requesterId: string;
  receiverId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  profile: AdminProfile;
  requester: AdminUserMini;
  receiver: AdminUserMini;
};

/* ---------- Admin Listings ---------- */

export type AdminListingCreator = {
  id: string;
  phone: string;
  name: string | null;
  gender: string | null;
  birthDate: string | null;
  isVerified: boolean;
  avgRating: number;
  photos: string[];
  createdAt: string;
};

export type AdminListing = {
  id: number;
  title: string;
  exerciseType: string;
  genderPreference: string;
  location: string;
  scheduledAt: string | null;
  maxInvites: number;
  approvedCount: number;
  remainingCapacity: number;
  requestCount: number;
  goDutch: boolean;
  moreInfo: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: AdminListingCreator | null;
};

export type ListingsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ListingsListResponse = {
  success: boolean;
  data: {
    listings: AdminListing[];
    pagination: ListingsPagination;
  };
};

export type ListingListParams = {
  search?: string;
  sport?: string;
  exerciseType?: string;
  location?: string;
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
};

/* ---------- Listing detail ---------- */

export type ListingDetail = {
  id: number;
  title: string;
  exerciseType: string;
  genderPreference: string;
  location: string;
  scheduledAt: string | null;
  maxInvites: number;
  isActive: boolean;
  goDutch: boolean;
  moreInfo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  creator: AdminListingCreator | null;
  capacity: {
    maxInvites: number;
    approved: number;
    remaining: number;
  };
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    items: AdminListingRequestItem[];
  };
};

export type AdminListingRequestItem = {
  id: number;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  requester: AdminListingCreator | null;
  receiver: AdminListingCreator | null;
};

export type ListingDetailResponse = {
  success: boolean;
  data: { listing: ListingDetail };
};

/* ---------- Requests (full) ---------- */

export type RequestUserMini = {
  id: string;
  name: string | null;
  phone: string;
  isVerified: boolean;
  isBlocked: boolean;
};

export type RequestProfileMini = {
  id: number;
  title: string;
  location: string;
  exerciseType: string;
  genderPreference: string;
  scheduledAt: string | null;
  maxInvites: number;
  isActive: boolean;
  userId: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
};

export type AdminRequestFull = {
  id: number;
  profileId: number;
  requesterId: string;
  receiverId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  profile: RequestProfileMini;
  requester: RequestUserMini;
  receiver: RequestUserMini;
};

export type RequestsListResponse = {
  success: boolean;
  requests: AdminRequestFull[];
  total: number;
  skip: number;
  take: number;
};

export type RequestListParams = {
  search?: string;
  status?: RequestStatus;
  profileId?: number;
  skip?: number;
  take?: number;
};

/* ---------- Request detail (richer user fields) ---------- */

export type RequestDetailUser = {
  id: string;
  name: string | null;
  phone: string;
  gender: string | null;
  interestedIn: string | null;
  bio: string | null;
  photos: string[];
  avgRating: number;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
};

export type AdminRequestDetail = {
  id: number;
  profileId: number;
  requesterId: string;
  receiverId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  profile: RequestProfileMini;
  requester: RequestDetailUser;
  receiver: RequestDetailUser;
};

export type RequestDetailResponse = {
  success: boolean;
  request: AdminRequestDetail;
};

/* ---------- Admins ---------- */

export type AdminRecord = {
  id: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    isVerified: boolean;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

// detail response has richer user fields
export type AdminDetailRecord = {
  id: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    birthDate: string | null;
    gender: string | null;
    interestedIn: string | null;
    preferredSports: string | null;
    preferredSessionTypes: string | null;
    bio: string | null;
    photos: string[];
    avgRating: number;
    isVerified: boolean;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type AdminsListResponse = {
  success: boolean;
  count: number;
  admins: AdminRecord[];
};

export type AdminDetailResponse = {
  success: boolean;
  admin: AdminDetailRecord;
};

export type CreateAdminResponse = {
  success: boolean;
  message: string;
  admin: AdminRecord;
};

/* ---------- Audit Logs ---------- */

export type AuditLogAdminUser = {
  id: string;
  name: string | null;
  phone: string;
};

export type AuditLogAdmin = {
  id: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: AuditLogAdminUser;
};

export type AuditLog = {
  id: string;
  adminId: number;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: AuditLogAdmin | null;
};

export type AuditLogsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuditLogsListResponse = {
  success: boolean;
  logs: AuditLog[];
  pagination: AuditLogsPagination;
};

export type AuditLogDetailResponse = {
  success: boolean;
  log: AuditLog;
};

export type AuditLogListParams = {
  page?: number;
  limit?: number;
  action?: string;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  from?: string; // ISO
  to?: string;   // ISO
};