import { getTranslations } from "next-intl/server";
import { CookiePreferencesLink } from "@/components/features/legal/CookiePreferencesLink";
import { Link } from "@/i18n/navigation";

const legalLinks = [
  { href: "/legal/notice", key: "notice" },
  { href: "/legal/privacy", key: "privacy" },
  { href: "/legal/cookies", key: "cookies" },
  { href: "/legal/terms", key: "terms" },
] as const;

export const Footer = async () => {
  const t = await getTranslations("footer");
  const common = await getTranslations("common");

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm leading-relaxed text-muted-foreground">
        <p className="max-w-prose text-start">{t("tagline")}</p>

        <nav aria-label={t("legalHeading")}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="underline hover:text-foreground">
                  {t(`legal.${link.key}`)}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesLink />
            </li>
          </ul>
        </nav>

        <p className="text-start">
          {common("brand")}
          {" · "}
          {t("rights")}
        </p>
      </div>
    </footer>
  );
};
