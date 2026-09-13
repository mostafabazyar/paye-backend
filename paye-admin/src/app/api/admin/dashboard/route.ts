import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";

export type DashboardStats = {
  users: { total: number };
  listings: { total: number; active: number };
  requests: { pending: number; approved: number; rejected: number };
};

export type DashboardResponse = {
  success: boolean;
  data: DashboardStats;
};

export async function GET() {
  const result = await serverFetch<DashboardResponse>("/api/admin/dashboard");

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}