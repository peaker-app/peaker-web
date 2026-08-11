import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";
import { redirect } from "@/i18n/navigation";
import { dashboardPath } from "@/lib/auth/nextPath";
import { getSession } from "@/lib/auth/session";
import { noIndex } from "@/lib/seo";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgotPassword" });

  return { title: t("title"), robots: noIndex() };
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getSession()) {
    redirect({ href: dashboardPath, locale });
  }

  const t = await getTranslations("auth.forgotPassword");

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl leading-relaxed font-semibold text-start">
          {t("title")}
        </h1>
        <p className="leading-relaxed text-muted-foreground text-start">
          {t("subtitle")}
        </p>
      </header>

      <ForgotPasswordForm />
    </section>
  );
}
