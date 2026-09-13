import { cookies } from "next/headers";

import { ADMIN_COOKIE, IMPERSONATION_COOKIE } from "@/lib/auth-constants";
export { ADMIN_COOKIE, IMPERSONATION_COOKIE };

const ONE_WEEK = 60 * 60 * 24 * 7;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Explicit flag — keep `false` while serving over plain HTTP.
  // Flip to `true` (or set COOKIE_SECURE=true in the environment)
  // once the admin panel is behind HTTPS.
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
};

export async function setAdminToken(token: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: ONE_WEEK,
  });
}

export async function getAdminToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value;
}

export async function clearAdminToken() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function setImpersonationToken(token: string) {
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: 60 * 30, // 30 min — matches backend
  });
}

export async function getImpersonationToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value;
}

export async function clearImpersonationToken() {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
}