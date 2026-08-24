"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  ListChecksIcon,
  MountainIcon,
  SettingsIcon,
  UserIcon,
  UserRoundSearchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { shouldRetry } from "@/hooks/usePagedQuery";
import { Link, usePathname } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/cn";
import type { ProfileResponse } from "@/types/api";

interface SidebarItem {
  href: string;
  labelKey:
    | "dashboard"
    | "myAscents"
    | "collections"
    | "profile"
    | "publicProfile"
    | "account";
  Icon: ComponentType<{ className?: string }>;
}

const sections = (publicProfileHref?: string): readonly SidebarItem[] => [
  { href: "/dashboard", labelKey: "dashboard", Icon: ActivityIcon },
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
  ...(publicProfileHref
    ? ([
        {
          href: publicProfileHref,
          labelKey: "publicProfile",
          Icon: UserRoundSearchIcon,
        },
      ] as const)
    : []),
  {
    href: "/dashboard/settings/account",
    labelKey: "account",
    Icon: SettingsIcon,
  },
];

const isActive = (pathname: string, href: string): boolean =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

const usePublicProfileHref = (): string | undefined => {
  const { data } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => apiFetch<ProfileResponse>(endpoints.profiles.me),
    retry: shouldRetry,
  });

  return data ? `/climbers/${data.slug}` : undefined;
};

export const Sidebar = ({ className }: { className?: string }) => {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const publicProfileHref = usePublicProfileHref();

  return (
    <nav aria-label={t("label")} className={cn("flex flex-col gap-1", className)}>
      {sections(publicProfileHref).map(({ href, labelKey, Icon }) => {
        const active = labelKey !== "publicProfile" && isActive(pathname, href);

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
