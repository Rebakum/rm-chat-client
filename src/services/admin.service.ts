import type { User } from "@/types/user.types";
import { apiClient } from "./apiClient";

export type AdminRole = "STUDENT" | "TEACHER" | "MODERATOR";
export type AdminUserStatus = "ACCEPTED" | "REJECTED";

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminUserStatus;
  role?: AdminRole | "ADMIN";
}

export interface CreateUserInput {
  displayName: string;
  email: string;
  role: AdminRole;
}

export interface AdminUser extends User {
  status: AdminUserStatus;
  createdById?: string | null;
}

export interface CreatedUser extends AdminUser {
  invite: "sent" | "printed" | "failed";
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  detail: string | null;
  createdAt: string;
  actor: { displayName: string; userId: string; role: User["role"] };
}

interface RawAdminUser {
  id?: string;
  userId?: string;
  email?: string;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  photoURL?: string | null;
  role?: string | null;
  status?: string | null;
  createdAt?: string;
  createdById?: string | null;
}

interface RawAuditLog {
  id?: string;
  action?: string;
  targetId?: string | null;
  targetUserId?: string | null;
  targetType?: string | null;
  metadata?: unknown;
  detail?: string | null;
  createdAt?: string;
  actor?: { id?: string; name?: string | null; displayName?: string | null; role?: string | null };
}

const ROLE_MAP: Record<string, User["role"]> = {
  admin: "ADMIN",
  moderator: "MODERATOR",
  teacher: "TEACHER",
  student: "STUDENT",
};

const STATUS_MAP: Record<string, AdminUserStatus> = {
  accepted: "ACCEPTED",
  pending: "ACCEPTED",
  rejected: "REJECTED",
  banned: "REJECTED",
};

// The DB stores role/status lowercase; the admin UI keys badges, filters and
// guards off the uppercase enums. Convert at the service boundary only.
const toAdminUser = (raw: RawAdminUser): AdminUser => {
  const id = raw.id || raw.userId || "";
  const email = raw.email || "";
  return {
    id,
    userId: raw.userId || id,
    email,
    displayName: raw.displayName || raw.name || raw.username || email.split("@")[0] || "Member",
    avatar: raw.photoURL ?? null,
    role: raw.role ? ROLE_MAP[raw.role.toLowerCase()] || "STUDENT" : "STUDENT",
    status: raw.status ? STATUS_MAP[raw.status.toLowerCase()] || "ACCEPTED" : "ACCEPTED",
    createdAt: raw.createdAt,
    createdById: raw.createdById ?? null,
  };
};

const toAuditEntry = (raw: RawAuditLog): AuditLogEntry => ({
  id: raw.id || "",
  action: raw.action || "",
  targetId: raw.targetId ?? raw.targetUserId ?? null,
  targetType: raw.targetType ?? (raw.targetUserId ? "user" : null),
  detail: raw.detail ?? (
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? typeof (raw.metadata as Record<string, unknown>).detail === "string"
        ? (raw.metadata as Record<string, string>).detail
        : Object.keys(raw.metadata).length
          ? JSON.stringify(raw.metadata)
          : null
      : null
  ),
  createdAt: raw.createdAt || new Date().toISOString(),
  actor: {
    displayName: raw.actor?.displayName || raw.actor?.name || "System",
    userId: raw.actor?.id || "",
    role: raw.actor?.role ? ROLE_MAP[raw.actor.role.toLowerCase()] || "ADMIN" : "ADMIN",
  },
});

export const adminService = {
  async getUsers(params: UserListParams = {}) {
    const query: Record<string, string> = {};
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status.toLowerCase();
    if (params.role) query.role = params.role.toLowerCase();
    const response = await apiClient.get<RawAdminUser[]>("/admin/users", query);
    return { ...response, data: (response.data || []).map(toAdminUser) };
  },

  async createUser(data: CreateUserInput) {
    return apiClient.post<CreatedUser>("/admin/invite", data);
  },

  // Accept/Reject lives on PATCH /users/:id/status (lowercase enum in the DB).
  async changeUserStatus(id: string, status: AdminUserStatus) {
    const response = await apiClient.patch<RawAdminUser>(
      `/users/${encodeURIComponent(id)}/status`,
      { status: status.toLowerCase() }
    );
    return { ...response, data: response.data ? toAdminUser(response.data) : undefined };
  },

  async getAuditLogs(page = 1, limit = 20, _scope?: "notifications") {
    const response = await apiClient.get<RawAuditLog[]>("/moderators/audit-logs", {
      page: String(page),
      limit: String(limit),
    });
    return { ...response, data: (response.data || []).map(toAuditEntry) };
  },
};
