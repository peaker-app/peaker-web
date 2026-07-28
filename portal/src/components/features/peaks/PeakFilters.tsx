"use client";

import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Slider } from "@/components/ui/Slider";
import { CountrySelect } from "@/components/forms/CountrySelect";
import type { Locale } from "@/i18n/config";
import { useRouter } from "@/i18n/navigation";
import { countryName } from "@/lib/countries";
import {
  maxAltitudeBound,
  minAltitudeBound,
  toQueryString,
  type PeakQuery,
} from "@/app/[locale]/(public)/peaks/searchParams";

export const PeakFilters = ({ query }: { query: PeakQuery }) => {
  const t = useTranslations("peaks.filters");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [region, setRegion] = useState(query.region);
  const [altitude, setAltitude] = useState<[number, number]>([
    Number(query.minAltitude || minAltitudeBound),
    Number(query.maxAltitude || maxAltitudeBound),
  ]);

  const apply = (changes: Partial<PeakQuery>) => {
    router.push(`/peaks${toQueryString({ ...query, ...changes })}`);
  };

  const applyAltitude = ([min, max]: [number, number]) =>
    apply({
      minAltitude: min === minAltitudeBound ? "" : String(min),
      maxAltitude: max === maxAltitudeBound ? "" : String(max),
    });

  const chips = [
    query.country
      ? { key: "country", label: countryName(locale, query.country), reset: { country: "" } }
      : undefined,
    query.region
      ? { key: "region", label: query.region, reset: { region: "" } }
      : undefined,
    query.minAltitude || query.maxAltitude
      ? {
          key: "altitude",
          label: t("altitudeRange", {
            min: query.minAltitude || minAltitudeBound,
            max: query.maxAltitude || maxAltitudeBound,
          }),
          reset: { minAltitude: "", maxAltitude: "" },
        }
      : undefined,
  ].filter((chip) => chip !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="country-filter">{t("country")}</Label>
        <CountrySelect
          id="country-filter"
          value={query.country}
          placeholder={t("anyCountry")}
          onChange={(country) => apply({ country })}
        />
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ region: region.trim() });
        }}
      >
        <Label htmlFor="region-filter">{t("region")}</Label>
        <Input
          id="region-filter"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          placeholder={t("regionPlaceholder")}
        />
      </form>

      <div className="flex flex-col gap-2">
        <Label htmlFor="altitude-filter">{t("altitude")}</Label>
        <Slider
          id="altitude-filter"
          min={minAltitudeBound}
          max={maxAltitudeBound}
          step={100}
          value={altitude}
          onValueChange={(value) => setAltitude([value[0] ?? 0, value[1] ?? 0])}
          onValueCommit={(value) =>
            applyAltitude([value[0] ?? minAltitudeBound, value[1] ?? maxAltitudeBound])
          }
          aria-label={t("altitude")}
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("altitudeRange", { min: altitude[0], max: altitude[1] })}
        </p>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              variant="outline"
              size="sm"
              className="gap-1"
              aria-label={t("remove", { name: chip.label })}
              onClick={() => apply(chip.reset)}
            >
              {chip.label}
              <XIcon aria-hidden className="size-3.5" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              apply({
                country: "",
                region: "",
                minAltitude: "",
                maxAltitude: "",
              })
            }
          >
            {t("clearAll")}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
