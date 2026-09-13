import { NextResponse } from "next/server";
import { getImpersonationToken } from "@/lib/auth";

/**
 * Peek at the impersonation JWT payload without verifying it.
 * Safe because:
 *   - The token is httpOnly.
 *   - The route only reads it and returns non-sensitive fields.
 *   - The backend will still reject any actual API call if the
 *     token is invalid/expired.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET() {
  const token = await getImpersonationToken();

  if (!token) {
    return NextResponse.json({ active: false });
  }

  const payload = decodeJwtPayload(token);
  if (!payload || payload.type !== "IMPERSONATION") {
    return NextResponse.json({ active: false });
  }

  const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : null;

  if (expiresAt && expiresAt <= Date.now()) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: true,
    user: {
      id: payload.id,
      phone: payload.phone,
    },
    impersonatedBy: payload.impersonatedBy,
    expiresAt,
  });
}