"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("errors.generic");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <TriangleAlertIcon aria-hidden className="size-10 text-destructive" />
      <h1
        ref={heading}
        tabIndex={-1}
        className="text-2xl leading-relaxed font-semibold outline-none"
      >
        {t("title")}
      </h1>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
      {error.digest ? (
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer">{t("reference")}</summary>
          <code className="mt-2 block">{error.digest}</code>
        </details>
      ) : null}
    </main>
  );
}
