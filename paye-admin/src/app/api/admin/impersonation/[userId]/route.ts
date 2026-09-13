import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api";
import { setImpersonationToken } from "@/lib/auth";

type ImpersonateResponse = {
  success: boolean;
  message: string;
  token: string;
  expiresIn: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    isVerified: boolean;
  };
  impersonation: {
    active: boolean;
    impersonatedBy: string;
  };
};

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const { userId } = await ctx.params;

  const result = await serverFetch<ImpersonateResponse>(
    `/api/admin/impersonation/${userId}`,
    { method: "POST" }
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status }
    );
  }

  const { token, user, expiresIn } = result.data;

  // Store the impersonation token in an httpOnly cookie.
  // It never touches the browser JS.
  await setImpersonationToken(token);

  // Return only the safe bits — no token.
  return NextResponse.json({
    success: true,
    user,
    expiresIn,
  });
}