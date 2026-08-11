"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Link } from "@/i18n/navigation";
import {
  closeCookiePreferences,
  openCookiePreferences,
  useCookiePreferencesOpen,
} from "./cookiePreferencesStore";
import { decideCookieConsent, useCookieConsent } from "./useCookieConsent";

const CookieBanner = () => {
  const t = useTranslations("legal.banner");

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-card p-4 shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <p className="max-w-prose text-sm leading-relaxed text-start">
          {t("body")}{" "}
          <Link href="/legal/cookies" className="font-medium underline">
            {t("readPolicy")}
          </Link>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => decideCookieConsent(true)}>
            {t("acceptAll")}
          </Button>
          <Button onClick={() => decideCookieConsent(false)}>
            {t("rejectAll")}
          </Button>
          <Button onClick={openCookiePreferences}>{t("configure")}</Button>
        </div>
      </div>
    </div>
  );
};

const CookiePreferencesDialog = () => {
  const t = useTranslations("legal.banner");
  const consent = useCookieConsent();
  const open = useCookiePreferencesOpen();
  const [maps, setMaps] = useState(consent?.maps ?? false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setMaps(consent?.maps ?? false);
    }
  }

  const save = () => {
    decideCookieConsent(maps);
    closeCookiePreferences();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? openCookiePreferences() : closeCookiePreferences())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("preferencesTitle")}</DialogTitle>
          <DialogDescription>{t("preferencesBody")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <input
              id="cookiesTechnical"
              type="checkbox"
              checked
              disabled
              readOnly
              className="mt-1 size-4"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="cookiesTechnical">{t("technicalLabel")}</Label>
              <p className="text-sm leading-relaxed text-muted-foreground text-start">
                {t("technicalBody")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="cookiesMaps"
              type="checkbox"
              checked={maps}
              onChange={(event) => setMaps(event.target.checked)}
              className="mt-1 size-4"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="cookiesMaps">{t("mapsLabel")}</Label>
              <p className="text-sm leading-relaxed text-muted-foreground text-start">
                {t("mapsBody")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={save}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CookieConsentGate = () => {
  const consent = useCookieConsent();
  const open = useCookiePreferencesOpen();

  return (
    <>
      {consent === undefined && !open ? <CookieBanner /> : null}
      <CookiePreferencesDialog />
    </>
  );
};
