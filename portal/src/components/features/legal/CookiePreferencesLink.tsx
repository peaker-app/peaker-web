"use client";

import { useTranslations } from "next-intl";
import { openCookiePreferences } from "./cookiePreferencesStore";

export const CookiePreferencesLink = () => {
  const t = useTranslations("legal.banner");

  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="underline hover:text-foreground"
    >
      {t("preferences")}
    </button>
  );
};
