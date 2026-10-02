import { EventEmitter } from "events";
import { getCollections } from "./db";
import { ActivityLog, Role } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var _auditEmitter: EventEmitter | undefined;
}

export const auditEmitter = global._auditEmitter || new EventEmitter();
if (process.env.NODE_ENV !== "production") {
  global._auditEmitter = auditEmitter;
}
auditEmitter.setMaxListeners(100);

export interface LogActivityParams {
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: Role | "ANONYMOUS" | "SYSTEM";
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// Sanitize metadata to guarantee no sensitive data is ever logged
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "code",
    "cookie",
    "privateKey",
    "credential",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const isSensitive = sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()));
    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function logActivity(params: LogActivityParams): Promise<ActivityLog> {
  const logEntry: ActivityLog = {
    timestamp: new Date(),
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole || "ANONYMOUS",
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: sanitizeMetadata(params.metadata),
    ip: params.ip,
    userAgent: params.userAgent,
  };

  try {
    const { activityLogs } = await getCollections();
    const result = await activityLogs.insertOne(logEntry);
    logEntry._id = result.insertedId;
  } catch (err: any) {
    console.error("[Audit Log Error]", err.message);
  }

  // Broadcast to live SSE listeners
  auditEmitter.emit("log", logEntry);

  return logEntry;
}
