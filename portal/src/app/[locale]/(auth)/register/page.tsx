import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { dashboardPath } from "@/lib/auth/nextPath";
import { noIndex } from "@/lib/seo";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });

  return { title: t("title"), robots: noIndex() };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getSession()) {
    redirect({ href: dashboardPath, locale });
  }

  const t = await getTranslations("auth.register");

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
      <RegisterForm />
    </section>
  );
}
