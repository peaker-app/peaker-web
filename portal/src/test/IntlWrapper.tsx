import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import messages from "../../messages/en.json";
import { defaultLocale, type Locale } from "@/i18n/config";

export interface IntlWrapperProps {
  children: ReactNode;
  locale?: Locale;
}

export const IntlWrapper = ({
  children,
  locale = defaultLocale,
}: IntlWrapperProps) => (
  <NextIntlClientProvider locale={locale} messages={messages}>
    {children}
  </NextIntlClientProvider>
);
