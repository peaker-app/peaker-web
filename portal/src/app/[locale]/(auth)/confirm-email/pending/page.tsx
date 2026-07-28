import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResendConfirmationCard } from "@/components/features/auth/ResendConfirmationCard";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { noIndex } from "@/lib/seo";

interface ResendPageProps {
  params: Promise<{ locale: string }>;
}

const resendPath = "/confirm-email/pending";

export async function generateMetadata({
  params,
}: ResendPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resend" });

  return { title: t("title"), robots: noIndex() };
}

export default async function ResendConfirmationPage({
  params,
}: ResendPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await getSession())) {
    redirect({
      href: `/login?next=${encodeURIComponent(`/${locale}${resendPath}`)}`,
      locale,
    });
  }

  return <ResendConfirmationCard />;
}
