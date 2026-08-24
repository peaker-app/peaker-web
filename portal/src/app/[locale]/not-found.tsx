import { CompassIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("errors.notFound");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <CompassIcon aria-hidden className="size-10 text-muted-foreground" />
      <p className="text-sm leading-relaxed font-medium text-muted-foreground">
        {t("code")}
      </p>
      <h1 className="text-2xl leading-relaxed font-semibold">{t("title")}</h1>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/peaks">{t("searchPeaks")}</Link>
        </Button>
      </div>
    </main>
  );
}
