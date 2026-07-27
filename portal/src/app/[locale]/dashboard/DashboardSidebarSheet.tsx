"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";

export const DashboardSidebarSheet = () => {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MenuIcon aria-hidden className="size-4" />
            {t("label")}
          </Button>
        </SheetTrigger>
        <SheetContent onClick={() => setOpen(false)}>
          <SheetTitle className="text-lg leading-relaxed font-semibold text-start">
            {t("label")}
          </SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
};
