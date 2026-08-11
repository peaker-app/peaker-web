import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { noIndex } from "@/lib/seo";

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resetPassword" });

  return { title: t("title"), robots: noIndex() };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const raw = query.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const t = await getTranslations("auth.resetPassword");

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

      <ResetPasswordForm token={token || undefined} />
    </section>
  );
}
