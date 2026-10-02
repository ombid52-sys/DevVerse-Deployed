import { Category, Platform } from "@/types";

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "WINDOWS", label: "Windows" },
  { value: "LINUX", label: "Linux" },
  { value: "MACOS", label: "macOS" },
  { value: "ANDROID", label: "Android" },
  { value: "WEB_APP", label: "Web" },
];

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "AI", label: "Artificial Intelligence", icon: "Brain" },
  { value: "GAMING", label: "Gaming", icon: "Gamepad2" },
  { value: "UTILITY", label: "Utility", icon: "Wrench" },
  { value: "DEVELOPER_TOOLS", label: "Developer Tools", icon: "Code2" },
  { value: "PRODUCTIVITY", label: "Productivity", icon: "CheckSquare" },
  { value: "EDUCATION", label: "Education", icon: "GraduationCap" },
  { value: "MULTIMEDIA", label: "Multimedia", icon: "Film" },
  { value: "FINANCE", label: "Finance", icon: "Coins" },
  { value: "SECURITY", label: "Security", icon: "Shield" },
  { value: "COMMUNICATION", label: "Communication", icon: "MessageSquare" },
  { value: "OTHER", label: "Other", icon: "Folder" },
];

export const SOURCE_LIMITS = {
  MAX_ZIP_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_EXTRACTED_SIZE_BYTES: 250 * 1024 * 1024, // 250 MB
  MAX_FILE_COUNT: 10_000,
  MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024, // 15 MB per single source file
  MAX_DIRECTORY_DEPTH: 15,
  MAX_COMPRESSION_RATIO: 100, // Ratio threshold for zip bomb protection
};

export const AUTH_LIMITS = {
  VERIFICATION_CODE_EXPIRY_MINUTES: 15,
  MAX_VERIFICATION_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60,
  BCRYPT_ROUNDS: 12,
  SESSION_DURATION_SECONDS: 60 * 60 * 24 * 7, // 7 days
  COOKIE_NAME: "devverse_session",
};

export const IGNORED_SOURCE_PATTERNS = [
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  "coverage",
  "vendor",
  ".cache",
  ".idea",
  ".vscode",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "target",
  "bin",
  "obj",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
];
