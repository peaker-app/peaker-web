import { useTranslations } from "next-intl";

export const mainContentId = "main-content";

export const SkipLink = () => {
  const t = useTranslations("common");

  return (
    <a
      href={`#${mainContentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
    >
      {t("skipToContent")}
    </a>
  );
};
