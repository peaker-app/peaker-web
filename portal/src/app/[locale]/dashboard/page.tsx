import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { DashboardGreeting } from "@/components/features/dashboard/DashboardGreeting";
import { DashboardStats } from "@/components/features/dashboard/DashboardStats";
import { RecentAscents } from "@/components/features/dashboard/RecentAscents";
import { UnconfirmedEmailBanner } from "@/components/features/dashboard/UnconfirmedEmailBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { noIndex } from "@/lib/seo";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.greeting" });

  return { title: t("title"), robots: noIndex() };
}

const rowSkeletons = (count: number) => (
  <ul className="flex flex-col gap-3">
    {Array.from({ length: count }, (_, index) => (
      <li key={index}>
        <Skeleton className="h-24 w-full" />
      </li>
    ))}
  </ul>
);

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <DashboardGreeting />
      </Suspense>

      <UnconfirmedEmailBanner />

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      <Suspense fallback={rowSkeletons(5)}>
        <RecentAscents />
      </Suspense>
    </div>
  );
}
