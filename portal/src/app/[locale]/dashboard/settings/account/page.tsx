import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountCards } from "@/components/features/settings/AccountCards";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
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

const loadDisplayName = async (): Promise<string> => {
  try {
    const profile = await serverFetch<ProfileResponse>(endpoints.profiles.me, {
      authenticated: true,
    });

    return profile.displayName;
  } catch {
    return "";
  }
};

export default async function AccountSettingsPage({
  params,
}: AccountSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const displayName = await loadDisplayName();
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
