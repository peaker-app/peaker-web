import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { MyAscentsList } from "@/components/features/ascents/MyAscentsList";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { noIndex } from "@/lib/seo";
import type { AscentSummaryResponse, PagedResponse } from "@/types/api";

const pageSize = 20;

interface MyAscentsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: MyAscentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ascents.mine" });

  return { title: t("title"), robots: noIndex() };
}

const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
};

export default async function MyAscentsPage({
  params,
  searchParams,
}: MyAscentsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = parsePage((await searchParams).page);
  const t = await getTranslations("ascents.mine");
  const common = await getTranslations("common.states");

  let ascents: PagedResponse<AscentSummaryResponse> | undefined;

  try {
    ascents = await serverFetch<PagedResponse<AscentSummaryResponse>>(
      `${endpoints.ascents.root}?page=${page}&size=${pageSize}`,
      { authenticated: true },
    );
  } catch {
    ascents = undefined;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {t("title")}
        </h1>
        <Button asChild>
          <Link href="/dashboard/ascents/new">{t("logAscent")}</Link>
        </Button>
      </header>

      {!ascents ? (
        <ErrorState message={common("errorTitle")} />
      ) : ascents.items.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.body")}
          action={
            <Button asChild>
              <Link href="/dashboard/ascents/new">{t("empty.action")}</Link>
            </Button>
          }
        />
      ) : (
        <MyAscentsList ascents={ascents} />
      )}
    </div>
  );
}
