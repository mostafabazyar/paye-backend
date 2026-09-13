import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import type { AuditLogDetailResponse } from "@/lib/types/admin";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await serverFetch<AuditLogDetailResponse>(
    `/api/admin/audit-logs/${id}`
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data);
}