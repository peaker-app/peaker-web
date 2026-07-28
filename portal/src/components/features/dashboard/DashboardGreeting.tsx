import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import type { ProfileResponse } from "@/types/api";

const loadDisplayName = async (): Promise<string | undefined> => {
  try {
    const profile = await serverFetch<ProfileResponse>(endpoints.profiles.me, {
      authenticated: true,
    });

    return profile.displayName;
  } catch {
    return undefined;
  }
};

export const DashboardGreeting = async () => {
  const displayName = await loadDisplayName();
  const t = await getTranslations("dashboard.greeting");

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {displayName ? t("titleNamed", { name: displayName }) : t("title")}
        </h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground text-start">
          {t("body")}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/ascents/new">{t("logAscent")}</Link>
      </Button>
    </header>
  );
};
