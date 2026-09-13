import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";

export async function PATCH(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await serverFetch(`/api/admin/requests/${id}/reject`, {
    method: "PATCH",
  });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data);
}