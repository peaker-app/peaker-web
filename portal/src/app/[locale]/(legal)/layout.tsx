import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { mainContentId } from "@/components/layout/SkipLink";

interface LegalLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LegalLayout({
  children,
  params,
}: LegalLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id={mainContentId} className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">{children}</div>
      </main>
      <Footer />
    </>
  );
}
