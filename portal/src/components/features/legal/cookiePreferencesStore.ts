"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

let open = false;

const emit = () => {
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

const getSnapshot = (): boolean => open;

const getServerSnapshot = (): boolean => false;

export const openCookiePreferences = (): void => {
  open = true;
  emit();
};

export const closeCookiePreferences = (): void => {
  open = false;
  emit();
};

export const useCookiePreferencesOpen = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
