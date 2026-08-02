"use client";

import { useQuery } from "@tanstack/react-query";
import { ActivityIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import type { SessionStateResponse } from "@/app/api/auth/session/route";

const fetchSession = async (): Promise<SessionStateResponse> => {
  const response = await fetch("/api/auth/session");

  return (await response.json()) as SessionStateResponse;
};

export const useSessionState = () =>
  useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: false,
  });

export const HeaderAuthActions = () => {
  const t = useTranslations("nav");
  const { data, isPending } = useSessionState();

  if (isPending) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (data?.authenticated) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">
          <ActivityIcon aria-hidden />
          {t("dashboard")}
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">{t("signIn")}</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/register">{t("signUp")}</Link>
      </Button>
    </>
  );
};
