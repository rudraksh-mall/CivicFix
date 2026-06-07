import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      currentScreen: "landing",
      selectedIssue: null,
      selectedLocation: null,
      reportImage: null,
      reportFile: null,
      currentAddress: "Select a location",

      /* GPS State */
      gpsLocation: null,
      gpsAccuracy: null,
      gpsAvailable: null,
      gpsError: null,
      gpsLoading: false,
      currentCity: null,
      currentWard: null,

      navigate: (screen, data = null) =>
        set((state) => ({
          currentScreen: screen,
          selectedLocation: data !== null ? data : state.selectedLocation,
        })),

      setCurrentAddress: (address) =>
        set({ currentAddress: address }),

      viewIssue: (issue) =>
        set({ selectedIssue: issue, currentScreen: "issue-detail" }),

      clearSelectedIssue: () => set({ selectedIssue: null }),

      setSelectedLocation: (location) =>
        set({ selectedLocation: location }),

      clearSelectedLocation: () => set({ selectedLocation: null }),

      setReportImage: (image) => set({ reportImage: image }),
      clearReportImage: () => set({ reportImage: null }),
      setReportFile: (file) => set({ reportFile: file }),
      clearReportFile: () => set({ reportFile: null }),

      setGpsState: (partial) =>
        set((state) => ({ ...state, ...partial })),

      setEditingIssue: (issue) => set({ editingIssue: issue }),

      clearReportContext: () =>
        set({
          selectedLocation: null,
          reportImage: null,
          reportFile: null,
          editingIssue: null,
        }),
    }),
    {
      name: "civicfix-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !["reportFile"].includes(key))
        ),
    }
  )
);
