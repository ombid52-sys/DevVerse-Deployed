import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { SessionPayload } from "@/types";
import { AUTH_LIMITS } from "./constants";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "devverse-fallback-secure-secret-key-at-least-32-chars-long"
);

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_LIMITS.SESSION_DURATION_SECONDS}s`)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();

  let isSecure = process.env.NODE_ENV === "production";
  try {
    const headerStore = await headers();
    const proto = headerStore.get("x-forwarded-proto");
    const host = headerStore.get("host") || "";
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
    if (isLocalhost) {
      isSecure = false;
    } else if (proto === "https" || process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://")) {
      isSecure = true;
    }
  } catch {
    // Retain default based on NODE_ENV
  }

  cookieStore.set(AUTH_LIMITS.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_LIMITS.SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_LIMITS.COOKIE_NAME, "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_LIMITS.COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
