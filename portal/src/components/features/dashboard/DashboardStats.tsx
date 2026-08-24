import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatsGrid } from "@/components/features/profile/StatsGrid";
import { endpoints } from "@/lib/api/endpoints";
import { loadProfileState } from "@/lib/api/profileState";
import type { ProfileStatsResponse } from "@/types/api";

export const DashboardStats = async () => {
  const stats = await loadProfileState<ProfileStatsResponse>(
    endpoints.profiles.myStats,
  );
  const t = await getTranslations("dashboard");
  const figures = await getTranslations("stats");
  const common = await getTranslations("common.states");

  if (stats.status === "pending") {
    return (
      <EmptyState
        title={t("profilePending.title")}
        description={t("profilePending.body")}
      />
    );
  }

  if (stats.status === "failed") {
    return <EmptyState title={common("errorTitle")} />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg leading-relaxed font-semibold text-start">
        {t("stats.heading")}
      </h2>
      <StatsGrid stats={stats.data} note={figures("eventualConsistency")} />
    </section>
  );
};
