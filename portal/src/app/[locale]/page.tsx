import { CompassIcon, MountainSnowIcon, TrendingUpIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense, type ComponentType } from "react";
import { FarewellNotice } from "@/components/features/landing/FarewellNotice";
import { RegisterCta } from "@/components/features/landing/RegisterCta";
import { FeaturedPeaks } from "@/components/features/peaks/FeaturedPeaks";
import { PeakSearchInput } from "@/components/features/peaks/PeakSearchInput";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { mainContentId } from "@/components/layout/SkipLink";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 3600;

interface LandingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.hero" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: alternatesFor(locale as Locale, "/"),
    openGraph: { title: t("title"), description: t("subtitle"), type: "website" },
  };
}

interface ValueProp {
  key: "search" | "log" | "stats";
  Icon: ComponentType<{ className?: string }>;
}

const valueProps: readonly ValueProp[] = [
  { key: "search", Icon: CompassIcon },
  { key: "log", Icon: MountainSnowIcon },
  { key: "stats", Icon: TrendingUpIcon },
];

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hero = await getTranslations("landing.hero");
  const props = await getTranslations("landing.valueProps");

  return (
    <>
      <Header />
      <main id={mainContentId} className="flex-1">
        <Suspense fallback={null}>
          <FarewellNotice />
        </Suspense>

        <section className="relative isolate bg-linear-to-b from-primary/15 via-background to-background">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center md:min-h-[70svh] md:justify-center">
            <h1 className="text-4xl leading-relaxed font-semibold text-balance">
              {hero("title")}
            </h1>
            <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
              {hero("subtitle")}
            </p>
            <PeakSearchInput className="max-w-xl" />
            <Button asChild variant="outline">
              <Link href="/peaks/nearby">{hero("nearbyCta")}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16">
          <h2 className="mb-6 text-2xl leading-relaxed font-semibold text-start">
            {props("heading")}
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {valueProps.map(({ key, Icon }) => (
              <li
                key={key}
                className="flex flex-col gap-2 rounded-md border border-border bg-card p-6 text-start"
              >
                <Icon aria-hidden className="size-8 text-primary" />
                <h3 className="text-lg leading-relaxed font-medium">
                  {props(`${key}Title`)}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {props(`${key}Body`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <FeaturedPeaks />
        <RegisterCta />
      </main>
      <Footer />
    </>
  );
}
