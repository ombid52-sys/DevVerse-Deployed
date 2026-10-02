import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getClientIp(req: Request | { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();
  return process.env.NODE_ENV === "production" ? "anonymous-client" : "127.0.0.1";
}

export function formatRole(role?: string | null): string {
  if (!role) return "";
  const map: Record<string, string> = {
    ADMIN: "Admin",
    DEVELOPER: "Developer",
    USER: "User",
    ANONYMOUS: "Anonymous",
    ANON: "Anonymous",
    SYSTEM: "System",
  };
  return map[role.toUpperCase()] || role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export function formatStatus(status?: string | null): string {
  if (!status) return "";
  const map: Record<string, string> = {
    ACTIVE: "Active",
    DISABLED: "Disabled",
    SUSPENDED: "Suspended",
  };
  return map[status.toUpperCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function formatVisibility(visibility?: string | null): string {
  if (!visibility) return "";
  const map: Record<string, string> = {
    PUBLIC: "Public",
    PRIVATE: "Private",
  };
  return map[visibility.toUpperCase()] || visibility.charAt(0).toUpperCase() + visibility.slice(1).toLowerCase();
}

export function formatSourceStatus(status?: string | null): string {
  if (!status) return "";
  const map: Record<string, string> = {
    READY: "Ready",
    PROCESSING: "Processing",
    NOT_UPLOADED: "Not Uploaded",
    UPLOADING: "Uploading",
    FAILED: "Failed",
  };
  return map[status.toUpperCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function formatPlatform(platform?: string | null): string {
  if (!platform) return "";
  const map: Record<string, string> = {
    WINDOWS: "Windows",
    LINUX: "Linux",
    MACOS: "macOS",
    ANDROID: "Android",
    WEB_APP: "Web",
    WEB: "Web",
  };
  return map[platform.toUpperCase()] || platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}

export function formatCategory(category?: string | null): string {
  if (!category) return "";
  const map: Record<string, string> = {
    AI: "Artificial Intelligence",
    GAMING: "Gaming",
    UTILITY: "Utility",
    DEVELOPER_TOOLS: "Developer Tools",
    PRODUCTIVITY: "Productivity",
    EDUCATION: "Education",
    MULTIMEDIA: "Multimedia",
    FINANCE: "Finance",
    SECURITY: "Security",
    COMMUNICATION: "Communication",
    OTHER: "Other",
  };
  return map[category.toUpperCase()] || category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

