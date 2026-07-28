import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatsGrid } from "@/components/features/profile/StatsGrid";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import type { ProfileStatsResponse } from "@/types/api";

const loadStats = async (): Promise<
  ProfileStatsResponse | "pending" | "failed"
> => {
  try {
    return await serverFetch<ProfileStatsResponse>(endpoints.profiles.myStats, {
      authenticated: true,
    });
  } catch (error) {
    return error instanceof ApiError && error.problem.status === 404
      ? "pending"
      : "failed";
  }
};

export const DashboardStats = async () => {
  const stats = await loadStats();
  const t = await getTranslations("dashboard");
  const figures = await getTranslations("stats");
  const common = await getTranslations("common.states");

  if (stats === "pending") {
    return (
      <EmptyState
        title={t("profilePending.title")}
        description={t("profilePending.body")}
      />
    );
  }

  if (stats === "failed") {
    return <EmptyState title={common("errorTitle")} />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg leading-relaxed font-semibold text-start">
        {t("stats.heading")}
      </h2>
      <StatsGrid stats={stats} note={figures("eventualConsistency")} />
    </section>
  );
};
