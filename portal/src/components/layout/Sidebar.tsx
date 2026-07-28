"use client";

import {
  LayoutDashboardIcon,
  ListChecksIcon,
  MountainIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface SidebarItem {
  href: string;
  labelKey: "dashboard" | "myAscents" | "collections" | "profile" | "account";
  Icon: ComponentType<{ className?: string }>;
}

const items: readonly SidebarItem[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: LayoutDashboardIcon },
  { href: "/dashboard/ascents", labelKey: "myAscents", Icon: MountainIcon },
  {
    href: "/dashboard/collections",
    labelKey: "collections",
    Icon: ListChecksIcon,
  },
  {
    href: "/dashboard/settings/profile",
    labelKey: "profile",
    Icon: UserIcon,
  },
  {
    href: "/dashboard/settings/account",
    labelKey: "account",
    Icon: SettingsIcon,
  },
];

const isActive = (pathname: string, href: string): boolean =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

export const Sidebar = ({ className }: { className?: string }) => {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className={cn("flex flex-col gap-1", className)}>
      {items.map(({ href, labelKey, Icon }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-accent/60",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
};
