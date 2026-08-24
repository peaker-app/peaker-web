import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountCards } from "@/components/features/settings/AccountCards";
import { endpoints } from "@/lib/api/endpoints";
import { loadProfileState } from "@/lib/api/profileState";
import { noIndex } from "@/lib/seo";
import type { ProfileResponse } from "@/types/api";

interface AccountSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AccountSettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings.account" });

  return { title: t("title"), robots: noIndex() };
}

export default async function AccountSettingsPage({
  params,
}: AccountSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await loadProfileState<ProfileResponse>(endpoints.profiles.me);
  const displayName =
    profile.status === "ready" ? profile.data.displayName : "";
  const t = await getTranslations("settings.account");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl leading-relaxed font-semibold text-start">
        {t("title")}
      </h1>
      <AccountCards displayName={displayName} />
    </div>
  );
}
