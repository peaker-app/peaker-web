import { NextResponse } from "next/server";
import { ensureSession } from "@/lib/auth/refresh";

export interface SessionStateResponse {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
}

export async function GET(): Promise<NextResponse<SessionStateResponse>> {
  const session = await ensureSession();

  return NextResponse.json({
    authenticated: session !== undefined,
    userId: session?.userId ?? null,
    email: session?.email ?? null,
  });
}
