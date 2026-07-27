"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UnitSystem = "metric";
export type AscentListView = "cards" | "table";

interface PreferencesState {
  unitSystem: UnitSystem;
  ascentListView: AscentListView;
  setAscentListView: (view: AscentListView) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      unitSystem: "metric",
      ascentListView: "cards",
      setAscentListView: (ascentListView) => set({ ascentListView }),
    }),
    { name: "peaker-preferences" },
  ),
);
