import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { loadProfileState } from "@/lib/api/profileState";
import type { ProfileResponse } from "@/types/api";

export const DashboardGreeting = async () => {
  const profile = await loadProfileState<ProfileResponse>(
    endpoints.profiles.me,
  );
  const t = await getTranslations("dashboard.greeting");
  const pending = await getTranslations("dashboard.profilePending");

  const displayName =
    profile.status === "ready" ? profile.data.displayName : undefined;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {displayName ? t("titleNamed", { name: displayName }) : t("title")}
        </h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground text-start">
          {profile.status === "pending" ? pending("body") : t("body")}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/ascents/new">{t("logAscent")}</Link>
      </Button>
    </header>
  );
};
