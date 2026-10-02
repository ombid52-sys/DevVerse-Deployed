import { ObjectId } from "mongodb";

export type Role = "USER" | "DEVELOPER" | "ADMIN";

export type AccountStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";

export type Platform = "WINDOWS" | "LINUX" | "MACOS" | "ANDROID" | "WEB_APP";

export type Category =
  | "AI"
  | "GAMING"
  | "UTILITY"
  | "DEVELOPER_TOOLS"
  | "PRODUCTIVITY"
  | "EDUCATION"
  | "MULTIMEDIA"
  | "FINANCE"
  | "SECURITY"
  | "COMMUNICATION"
  | "OTHER";

export type Visibility = "PUBLIC" | "PRIVATE";

export type SourceProcessingStatus =
  | "NOT_UPLOADED"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED";

export interface User {
  _id: ObjectId | string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  disabledUntil?: Date | string | null;
  bio?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VerificationCode {
  _id?: ObjectId | string;
  userId: ObjectId | string;
  email: string;
  code: string;
  type: "REGISTRATION" | "PASSWORD_RESET";
  expiresAt: Date | string;
  attempts: number;
  used: boolean;
  createdAt: Date | string;
}

export interface LanguageStat {
  language: string;
  percentage: number;
  bytes: number;
}

export interface SourceTreeNode {
  path: string;
  name: string;
  type: "file" | "directory";
  size?: number;
  children?: SourceTreeNode[];
}

export type RuntimeType = "STATIC_ZIP" | "EXTERNAL_URL" | "BOTH";

export interface Application {
  _id: ObjectId | string;
  slug: string;
  name: string;
  description: string;
  ownerId: ObjectId | string;
  ownerUsername: string;
  ownerDisplayName?: string;
  ownerAvatarUrl?: string;
  ownerBio?: string;
  platform: Platform;
  category: Category;
  thumbnailUrl: string;
  heroBannerUrl?: string;
  screenshots: string[];
  runtimeUrl?: string;
  isRunnable?: boolean;
  runtimeType?: RuntimeType | null;
  entrypointPath?: string | null;
  visibility: Visibility;
  sourceStatus: SourceProcessingStatus;
  sourceArchiveSize?: number;
  sourceStorageKey?: string | null;
  sourceDriveFileId?: string | null;
  sourceFileCount?: number;
  sourceTree?: SourceTreeNode[];
  languages?: LanguageStat[];
  sourceError?: string | null;
  isDeleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Favorite {
  _id?: ObjectId | string;
  userId: ObjectId | string;
  applicationId: ObjectId | string;
  createdAt: Date | string;
}

export interface Collection {
  _id: ObjectId | string;
  name: string;
  description?: string;
  ownerId: ObjectId | string;
  applicationIds: (ObjectId | string)[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ActivityLog {
  _id?: ObjectId | string;
  timestamp: Date | string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: Role | "ANONYMOUS" | "SYSTEM";
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  status: AccountStatus;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: Category;
  platform?: Platform;
  sort?: "newest" | "oldest" | "name";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
