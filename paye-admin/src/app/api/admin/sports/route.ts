import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import type { SportsListResponse } from "@/lib/types/admin";

export async function GET() {
  const result = await serverFetch<SportsListResponse>("/api/admin/sports");

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await serverFetch("/api/admin/sports", {
    method: "POST",
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data, { status: 201 });
}