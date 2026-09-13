import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import type {
  AdminsListResponse,
  CreateAdminResponse,
} from "@/lib/types/admin";

export async function GET() {
  const result = await serverFetch<AdminsListResponse>("/api/admin/admins");

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

  const result = await serverFetch<CreateAdminResponse>(
    "/api/admin/admins",
    { method: "POST", body }
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data, { status: 201 });
}