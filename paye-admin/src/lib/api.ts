import { getAdminToken, getImpersonationToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

type ServerFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** when true, use the impersonation token if present */
  useImpersonation?: boolean;
  /** forward these headers (rarely needed) */
  headers?: Record<string, string>;
  /** Next cache options */
  cache?: RequestCache;
};

/**
 * Server-side fetch to the Express backend.
 * Automatically attaches Authorization: Bearer <admin|impersonation token>.
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<ApiResult<T>> {
  const {
    method = "GET",
    body,
    useImpersonation = false,
    headers = {},
    cache = "no-store",
  } = options;

  const token = useImpersonation
    ? (await getImpersonationToken()) ?? (await getAdminToken())
    : await getAdminToken();

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: json?.message ?? `Request failed (${res.status})`,
      };
    }

    return { ok: true, data: json as T };
  } catch (err) {
    console.error(`serverFetch error [${method} ${path}]:`, err);
    return {
      ok: false,
      status: 500,
      message: "Network error talking to backend",
    };
  }
}