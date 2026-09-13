import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await serverFetch<{ success: boolean; message: string; devOtp?: string }>(
    "/api/admin/auth/login",
    { method: "POST", body }
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}