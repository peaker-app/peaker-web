import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { CookieConsentGate } from "@/components/features/legal/CookieConsentGate";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { SkipLink } from "@/components/layout/SkipLink";
import { getDirection, locales, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { alternatesFor, siteUrl } from "@/lib/seo";
import { fontClassName, leadingClassName } from "./fonts";
import "../globals.css";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = () =>
  locales.map((locale) => ({ locale }));

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const footer = await getTranslations({ locale, namespace: "footer" });

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("brand"), template: `%s · ${t("brand")}` },
    description: footer("tagline"),
    alternates: alternatesFor(locale as Locale, "/"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={cn("h-full antialiased", fontClassName(locale))}
    >
      <body className={cn("flex min-h-full flex-col", leadingClassName(locale))}>
        <NextIntlClientProvider>
          <QueryProvider>
            <SkipLink />
            {children}
            <CookieConsentGate />
            <Toaster position="bottom-center" closeButton />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
