import { NextResponse, type NextRequest } from "next/server";
import { crossSiteProblem, isSameOriginRequest } from "@/lib/api/csrf";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { readAccessToken } from "@/lib/auth/cookies";

interface PersonalDataExport {
  exportedAtUtc: string;
  account: unknown;
  profile: unknown;
  ascents: unknown;
}

const fileName = (): string =>
  `peaker-export-${new Date().toISOString().slice(0, 10)}.json`;

const collect = async (): Promise<PersonalDataExport> => {
  const [account, profile, ascents] = await Promise.all([
    serverFetch<unknown>(endpoints.auth.exportMyData, { authenticated: true }),
    serverFetch<unknown>(endpoints.profiles.myExport, { authenticated: true }),
    serverFetch<unknown>(endpoints.ascents.myExport, { authenticated: true }),
  ]);

  return {
    exportedAtUtc: new Date().toISOString(),
    account,
    profile,
    ascents,
  };
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return crossSiteProblem();
  }

  if (!(await readAccessToken())) {
    return NextResponse.json(
      { status: 401, title: "Export.NotAuthenticated" },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json(await collect(), {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { status: 503, title: "Export.Incomplete" },
      { status: 503 },
    );
  }
}
