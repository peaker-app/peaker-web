import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AscentCard } from "@/components/features/ascents/AscentCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import type { AscentSummaryResponse, PagedResponse } from "@/types/api";

const recentCount = 5;

const loadRecent = async (): Promise<
  PagedResponse<AscentSummaryResponse> | undefined
> => {
  try {
    return await serverFetch<PagedResponse<AscentSummaryResponse>>(
      `${endpoints.ascents.root}?page=1&size=${recentCount}`,
      { authenticated: true },
    );
  } catch {
    return undefined;
  }
};

export const RecentAscents = async () => {
  const recent = await loadRecent();
  const t = await getTranslations("dashboard");
  const common = await getTranslations("common.states");

  if (!recent) {
    return <ErrorState message={common("errorTitle")} />;
  }

  if (recent.items.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.body")}
        action={
          <Button asChild>
            <Link href="/dashboard/ascents/new">{t("empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg leading-relaxed font-semibold text-start">
        {t("recent.heading")}
      </h2>
      <ul className="flex flex-col gap-3">
        {recent.items.map((ascent) => (
          <AscentCard
            key={ascent.id}
            ascent={ascent}
            href={`/dashboard/ascents/${ascent.id}`}
            showVisibility
          />
        ))}
      </ul>
      <Link
        href="/dashboard/ascents"
        className="text-start font-medium hover:underline"
      >
        {t("recent.seeAll")}
      </Link>
    </section>
  );
};
