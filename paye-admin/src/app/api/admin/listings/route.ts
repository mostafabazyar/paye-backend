import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import type { ListingsListResponse } from "@/lib/types/admin";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const path = `/api/admin/listings${qs ? `?${qs}` : ""}`;

  const result = await serverFetch<ListingsListResponse>(path);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}