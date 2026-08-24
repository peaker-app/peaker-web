"use client";

import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { allowedAvatarTypes, maxAvatarMegabytes } from "@/lib/profile/avatar";
import { AvatarPreview } from "./AvatarPreview";
import { useAvatarActions } from "./useAvatarActions";

export interface AvatarUploaderProps {
  avatarUrl: string | null;
  displayName: string;
}

export const AvatarUploader = ({
  avatarUrl,
  displayName,
}: AvatarUploaderProps) => {
  const t = useTranslations("settings.profile.avatar");
  const inputId = useId();
  const { upload, remove, busy, failure } = useAvatarActions();
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg leading-relaxed font-semibold text-start">
        {t("heading")}
      </h2>

      <div className="flex flex-wrap items-center gap-4">
        <AvatarPreview
          avatarUrl={avatarUrl}
          displayName={displayName}
          alt={t("alt", { name: displayName })}
        />

        <div className="flex flex-col gap-2">
          <input
            id={inputId}
            type="file"
            accept={allowedAvatarTypes.join(",")}
            className="sr-only"
            onChange={(event) => {
              const [file] = event.target.files ?? [];

              if (file) {
                void upload(file);
              }

              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" disabled={busy}>
              <label htmlFor={inputId} className="cursor-pointer gap-2">
                <ImagePlusIcon aria-hidden className="size-4" />
                {t("change")}
              </label>
            </Button>
            {avatarUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                <Trash2Icon aria-hidden className="size-4" />
                {t("remove")}
              </Button>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground text-start">
            {avatarUrl ? t("help", { size: maxAvatarMegabytes }) : t("empty")}
          </p>
        </div>
      </div>

      {failure ? (
        <p role="alert" className="text-sm leading-relaxed text-destructive text-start">
          {failure}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("confirmRemoveTitle")}
        description={t("confirmRemoveBody")}
        confirmLabel={t("confirmRemoveAction")}
        onConfirm={() => {
          setConfirming(false);
          void remove();
        }}
      />
    </section>
  );
};
