"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useEmailConfirmation } from "@/stores/emailConfirmation";

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const clearUnconfirmed = useEmailConfirmation((state) => state.clear);

  const revoke = async (path: string) => {
    setPending(true);
    await fetch(path, { method: "POST" });
    queryClient.clear();
    clearUnconfirmed();
    router.replace("/");
    router.refresh();
  };

  return {
    pending,
    signOut: () => revoke("/api/auth/logout"),
    signOutEverywhere: () => revoke("/api/auth/logout/all"),
  };
};
