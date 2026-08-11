import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/features/legal/LegalDocument";

interface LegalPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return { title: t("title") };
}

export default async function PrivacyPage({ params }: LegalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocument id="privacy" />;
}
