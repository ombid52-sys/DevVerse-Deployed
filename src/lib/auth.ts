import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AUTH_LIMITS } from "./constants";
import { getCollections, toObjectId } from "./db";
import { getSession } from "./session";
import { User, Role } from "@/types";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_LIMITS.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  const { users } = await getCollections();
  const user = await users.findOne({ _id: toObjectId(session.userId) });

  if (!user) {
    return null;
  }

  // Check if account is temporarily disabled and if the duration has expired
  if (user.status === "DISABLED") {
    if (user.disabledUntil && new Date(user.disabledUntil) <= new Date()) {
      // Auto-reactivate expired temporary disable
      await users.updateOne(
        { _id: user._id },
        { $set: { status: "ACTIVE", disabledUntil: null, updatedAt: new Date() } }
      );
      user.status = "ACTIVE";
      user.disabledUntil = null;
    } else {
      const untilText = user.disabledUntil
        ? ` until ${new Date(user.disabledUntil).toLocaleString()}`
        : "";
      throw new AuthError(`Account is temporarily disabled${untilText}.`, 403);
    }
  }

  // Check if account is suspended
  if (user.status === "SUSPENDED") {
    throw new AuthError("Account has been permanently suspended by administrator.", 403);
  }

  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthError("Authentication required.", 401);
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("You do not have permission to perform this action.", 403);
  }
  return user;
}

export async function requireDeveloper(): Promise<User> {
  return requireRole(["DEVELOPER", "ADMIN"]);
}

export async function requireAdmin(): Promise<User> {
  return requireRole(["ADMIN"]);
}
