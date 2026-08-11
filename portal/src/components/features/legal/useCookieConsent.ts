"use client";

import { useSyncExternalStore } from "react";
import {
  consentCookieName,
  parseConsent,
  writeConsent,
  type CookieConsent,
} from "@/lib/legal/consent";

const listeners = new Set<() => void>();

let cachedRaw: string | undefined;
let cachedConsent: CookieConsent | undefined;

const rawCookie = (): string | undefined =>
  typeof document === "undefined"
    ? undefined
    : document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${consentCookieName}=`))
        ?.slice(consentCookieName.length + 1);

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): CookieConsent | undefined => {
  const raw = rawCookie();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConsent = parseConsent(raw);
  }

  return cachedConsent;
};

const getServerSnapshot = (): CookieConsent | undefined => undefined;

export const decideCookieConsent = (maps: boolean): void => {
  writeConsent(maps);
  notify();
};

export const useCookieConsent = (): CookieConsent | undefined =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
