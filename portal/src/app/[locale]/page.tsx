import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { mainContentId } from "@/components/layout/SkipLink";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

export const revalidate = 3600;

interface LandingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const common = await getTranslations("common");
  const footer = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <>
      <Header />
      <main
        id={mainContentId}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center"
      >
        <h1 className="max-w-3xl text-4xl leading-relaxed font-semibold text-balance">
          {common("brand")}
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
          {footer("tagline")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/peaks">{nav("peaks")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/peaks/nearby">{nav("nearby")}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
