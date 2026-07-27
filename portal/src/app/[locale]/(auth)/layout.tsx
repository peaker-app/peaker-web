import { MountainSnowIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { mainContentId } from "@/components/layout/SkipLink";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <main
      id={mainContentId}
      className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12"
    >
      <div className="flex w-full max-w-md items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MountainSnowIcon aria-hidden className="size-6 text-primary" />
          {t("brand")}
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
