import { getTranslations } from "next-intl/server";

export const Footer = async () => {
  const t = await getTranslations("footer");
  const common = await getTranslations("common");

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm leading-relaxed text-muted-foreground">
        <p className="max-w-prose text-start">{t("tagline")}</p>
        <p className="text-start">
          {common("brand")}
          {" · "}
          {t("rights")}
        </p>
      </div>
    </footer>
  );
};
