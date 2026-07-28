"use client";

import { ChevronDownIcon, ChevronUpIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  allowedPhotoTypes,
  maxPhotoMegabytes,
  maxPhotos,
  movePhoto,
  selectPhotos,
  type PhotoCandidate,
} from "@/lib/ascents/photos";

export interface PhotoUploaderProps {
  photos: PhotoCandidate[];
  onChange: (photos: PhotoCandidate[]) => void;
}

export const PhotoUploader = ({ photos, onChange }: PhotoUploaderProps) => {
  const t = useTranslations("ascentForm.photos");
  const inputId = useId();
  const [rejections, setRejections] = useState<string[]>([]);

  useEffect(
    () => () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    },
    [photos],
  );

  const add = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const { accepted, rejected } = selectPhotos(
      photos,
      [...files],
      (file) => URL.createObjectURL(file),
    );

    onChange([...photos, ...accepted]);
    setRejections(
      rejected.map((entry) =>
        t(entry.reason, {
          name: entry.name,
          size: maxPhotoMegabytes,
          max: maxPhotos,
        }),
      ),
    );
  };

  const remove = (index: number) => {
    const photo = photos[index];

    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    onChange(photos.filter((_, position) => position !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted-foreground text-start">
        {t("help", { max: maxPhotos, size: maxPhotoMegabytes })}
      </p>

      {photos.length < maxPhotos ? (
        <>
          <input
            id={inputId}
            type="file"
            accept={allowedPhotoTypes.join(",")}
            capture="environment"
            multiple
            className="sr-only"
            onChange={(event) => {
              add(event.target.files);
              event.target.value = "";
            }}
          />
          <Button asChild variant="outline" className="self-start">
            <label htmlFor={inputId} className="cursor-pointer gap-2">
              <ImagePlusIcon aria-hidden className="size-4" />
              {t("add")}
            </label>
          </Button>
        </>
      ) : null}

      <p aria-live="polite" className="text-sm leading-relaxed text-muted-foreground">
        {t("counter", { count: photos.length, max: maxPhotos })}
      </p>

      {rejections.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1">
          {rejections.map((message) => (
            <li key={message} className="text-sm leading-relaxed text-destructive">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-col gap-2 rounded-md border border-border p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt=""
                className="h-28 w-full rounded-md object-cover"
              />
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm">{index + 1}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveUp", { index: index + 1 })}
                    disabled={index === 0}
                    onClick={() => onChange(movePhoto(photos, index, index - 1))}
                  >
                    <ChevronUpIcon aria-hidden className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveDown", { index: index + 1 })}
                    disabled={index === photos.length - 1}
                    onClick={() => onChange(movePhoto(photos, index, index + 1))}
                  >
                    <ChevronDownIcon aria-hidden className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove", { index: index + 1 })}
                    onClick={() => remove(index)}
                  >
                    <XIcon aria-hidden className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
