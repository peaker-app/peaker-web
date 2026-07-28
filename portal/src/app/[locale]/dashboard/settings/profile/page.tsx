import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { AvatarUploader } from "@/components/features/settings/AvatarUploader";
import { ProfileDataForm } from "@/components/features/settings/ProfileDataForm";
import { SlugForm } from "@/components/features/settings/SlugForm";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { noIndex } from "@/lib/seo";
import type { ProfileResponse } from "@/types/api";

interface ProfileSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ProfileSettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings.profile" });

  return { title: t("title"), robots: noIndex() };
}

const loadProfile = async (): Promise<ProfileResponse | undefined> => {
  try {
    return await serverFetch<ProfileResponse>(endpoints.profiles.me, {
      authenticated: true,
    });
  } catch {
    return undefined;
  }
};

export default async function ProfileSettingsPage({
  params,
}: ProfileSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await loadProfile();
  const t = await getTranslations("settings.profile");
  const dashboard = await getTranslations("dashboard.profilePending");

  if (!profile) {
    return (
      <EmptyState title={dashboard("title")} description={dashboard("body")} />
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl leading-relaxed font-semibold text-start">
        {t("title")}
      </h1>

      <AvatarUploader
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
      />

      <ProfileDataForm profile={profile} />

      <SlugForm slug={profile.slug} />

      <Link
        href={`/climbers/${profile.slug}`}
        className="text-start font-medium hover:underline"
      >
        {t("viewPublic")}
      </Link>
    </div>
  );
}
