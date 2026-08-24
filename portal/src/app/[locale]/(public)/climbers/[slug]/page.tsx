import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { PublicAscentsList } from "@/components/features/profile/PublicAscentsList";
import { StatsGrid } from "@/components/features/profile/StatsGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { alternatesFor } from "@/lib/seo";
import type { PublicProfileResponse } from "@/types/api";

export const revalidate = 300;
export const generateStaticParams = () => [];

interface ClimberPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const loadProfile = async (
  slug: string,
): Promise<PublicProfileResponse | undefined> => {
  try {
    return await serverFetch<PublicProfileResponse>(
      endpoints.profiles.bySlug(slug),
      { revalidate },
    );
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) {
      return undefined;
    }

    throw error;
  }
};

export async function generateMetadata({
  params,
}: ClimberPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const profile = await loadProfile(slug);

  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: "profile.public" });

  return {
    title: profile.displayName,
    description: t("metaDescription", { name: profile.displayName }),
    alternates: alternatesFor(locale as Locale, `/climbers/${slug}`),
    openGraph: { title: profile.displayName, type: "profile" },
  };
}

export default async function PublicProfilePage({ params }: ClimberPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const profile = await loadProfile(slug);

  if (!profile) {
    notFound();
  }

  const t = await getTranslations("profile.public");
  const stats = await getTranslations("stats");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <ProfileHeader profile={profile} />
      <StatsGrid stats={profile.stats} note={stats("publicOnly")} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg leading-relaxed font-semibold text-start">
          {t("ascentsHeading")}
        </h2>
        <Suspense
          fallback={
            <ul className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-24 w-full" />
                </li>
              ))}
            </ul>
          }
        >
          <PublicAscentsList userId={profile.userId} />
        </Suspense>
      </section>
    </div>
  );
}
