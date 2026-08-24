import { createFormatter, createTranslator } from "use-intl";
import type { AbstractIntlMessages } from "use-intl";
import dictionary from "../../messages/en.json";

const messages = dictionary as AbstractIntlMessages;

export const serverIntlDouble = {
  getTranslations: async (namespace?: string) =>
    createTranslator({ locale: "en", messages, namespace }),
  getFormatter: async () => createFormatter({ locale: "en" }),
  getLocale: async () => "en",
  setRequestLocale: () => undefined,
};
