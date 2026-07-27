import { MountainSnowIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderAuthActions } from "./HeaderAuthActions";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

export const Header = async () => {
  const t = await getTranslations("nav");
  const common = await getTranslations("common");

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MountainSnowIcon aria-hidden className="size-6 text-primary" />
          {common("brand")}
        </Link>

        <nav aria-label={t("label")} className="hidden gap-4 md:flex">
          <Link href="/peaks" className="text-sm hover:underline">
            {t("peaks")}
          </Link>
          <Link href="/peaks/nearby" className="text-sm hover:underline">
            {t("nearby")}
          </Link>
        </nav>

        <div className="ms-auto hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <HeaderAuthActions />
        </div>

        <div className="ms-auto md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
};
