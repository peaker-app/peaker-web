"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Link } from "@/i18n/navigation";
import { useSessionState } from "./HeaderAuthActions";
import { LocaleSwitcher } from "./LocaleSwitcher";

export const MobileNav = () => {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const { data } = useSessionState();

  const guestLinks = [
    { href: "/login", label: t("signIn") },
    { href: "/register", label: t("signUp") },
  ] as const;

  const memberLinks = [{ href: "/dashboard", label: t("dashboard") }] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent aria-label={t("label")}>
        <SheetTitle className="text-lg leading-relaxed font-semibold text-start">
          {t("label")}
        </SheetTitle>
        <nav className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link href="/peaks">{t("peaks")}</Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/peaks/nearby">{t("nearby")}</Link>
          </SheetClose>
          {(data?.authenticated ? memberLinks : guestLinks).map((link) => (
            <SheetClose key={link.href} asChild>
              <Link href={link.href}>{link.label}</Link>
            </SheetClose>
          ))}
        </nav>
        <LocaleSwitcher />
      </SheetContent>
    </Sheet>
  );
};
