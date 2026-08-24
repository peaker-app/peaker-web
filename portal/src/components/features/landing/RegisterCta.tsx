"use client";

import { useTranslations } from "next-intl";
import { useSessionState } from "@/components/layout/HeaderAuthActions";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";

export const RegisterCta = () => {
  const t = useTranslations("landing.cta");
  const { data, isPending } = useSessionState();

  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h2 className="text-2xl leading-relaxed font-semibold">
          {t("heading")}
        </h2>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
        {isPending ? (
          <Skeleton className="h-11 w-40" />
        ) : (
          <Button asChild size="lg">
            <Link href={data?.authenticated ? "/dashboard" : "/register"}>
              {data?.authenticated ? t("dashboard") : t("signUp")}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
};
