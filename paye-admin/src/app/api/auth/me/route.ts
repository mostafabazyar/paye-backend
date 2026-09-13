import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";

export async function GET() {
  const result = await serverFetch<{ success: boolean; user: any }>(
    "/api/admin/auth/me"
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}