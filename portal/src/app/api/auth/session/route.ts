import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export interface SessionStateResponse {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
}

export async function GET(): Promise<NextResponse<SessionStateResponse>> {
  const session = await getSession();

  return NextResponse.json({
    authenticated: session !== undefined,
    userId: session?.userId ?? null,
    email: session?.email ?? null,
  });
}
