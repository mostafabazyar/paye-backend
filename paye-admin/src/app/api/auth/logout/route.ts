import { NextResponse } from "next/server";
import { clearAdminToken, clearImpersonationToken } from "@/lib/auth";

export async function POST() {
  await clearAdminToken();
  await clearImpersonationToken();
  return NextResponse.json({ success: true });
}