"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { locales, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

const currentQuery = (): Record<string, string> =>
  typeof window === "undefined"
    ? {}
    : Object.fromEntries(new URLSearchParams(window.location.search).entries());

export const LocaleSwitcher = () => {
  const t = useTranslations("common.locale");
  const current = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (value: string) => {
    startTransition(() => {
      router.replace(
        { pathname, query: currentQuery() },
        { locale: value as Locale },
      );
    });
  };

  return (
    <Select value={current} onValueChange={changeLocale} disabled={isPending}>
      <SelectTrigger className="w-auto min-w-36 gap-2" aria-label={t("label")}>
        <GlobeIcon aria-hidden className="size-4 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale} lang={locale}>
            {t(locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
