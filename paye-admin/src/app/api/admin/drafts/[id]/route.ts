import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import type { DraftDetailResponse } from "@/lib/types/admin";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await serverFetch<DraftDetailResponse>(
    `/api/admin/drafts/${id}`
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const result = await serverFetch(`/api/admin/drafts/${id}`, {
    method: "DELETE",
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data);
}