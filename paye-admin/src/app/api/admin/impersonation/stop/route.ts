import { NextResponse } from "next/server";
import { clearImpersonationToken } from "@/lib/auth";

export async function POST() {
  await clearImpersonationToken();
  return NextResponse.json({ success: true });
}