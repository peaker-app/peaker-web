import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConfirmEmailView } from "@/components/features/auth/ConfirmEmailView";
import { noIndex } from "@/lib/seo";

interface ConfirmEmailPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ConfirmEmailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.confirmEmail" });

  return { title: t("title"), robots: noIndex() };
}

export default async function ConfirmEmailPage({
  params,
  searchParams,
}: ConfirmEmailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const raw = query.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim();

  return <ConfirmEmailView token={token || undefined} />;
}
