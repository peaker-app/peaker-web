"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";

export const FarewellNotice = () => {
  const t = useTranslations("landing.farewell");
  const searchParams = useSearchParams();

  if (searchParams.get("deleted") !== "1") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6">
      <Alert role="status">
        <div className="flex flex-col gap-1">
          <AlertTitle>{t("title")}</AlertTitle>
          <AlertDescription>{t("body")}</AlertDescription>
        </div>
      </Alert>
    </div>
  );
};
