import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";

type VerifyResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    isVerified: boolean;
  };
};

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await serverFetch<VerifyResponse>(
    "/api/admin/auth/verify",
    { method: "POST", body }
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  const { token, user, message } = result.data;

  await setAdminToken(token);

  return NextResponse.json({ success: true, message, user });
}