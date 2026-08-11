import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { redirect } from "@/i18n/navigation";
import { dashboardPath, sanitizeNextPath } from "@/lib/auth/nextPath";
import { getSession } from "@/lib/auth/session";
import { noIndex } from "@/lib/seo";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const single = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });

  return { title: t("title"), robots: noIndex() };
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getSession()) {
    redirect({ href: dashboardPath, locale });
  }

  const query = await searchParams;
  const t = await getTranslations("auth.login");

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

      {single(query.registered) === "1" ? (
        <Alert role="status">
          <AlertDescription>{t("registered")}</AlertDescription>
        </Alert>
      ) : null}

      {single(query.reset) === "1" ? (
        <Alert role="status">
          <AlertDescription>{t("reset")}</AlertDescription>
        </Alert>
      ) : null}

      <LoginForm next={sanitizeNextPath(single(query.next))} />
    </section>
  );
}
