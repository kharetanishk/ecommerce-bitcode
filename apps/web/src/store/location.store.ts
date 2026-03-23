import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationStore {
  city: string | null;
  state: string | null;
  pincode: string | null;
  detectedBy: "ip" | "pincode" | null;
  setLocation: (loc: { city: string; state: string; pincode: string }) => void;
  setFromIp: (loc: { city: string; state: string }) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      city: null,
      state: null,
      pincode: null,
      detectedBy: null,

      setLocation: (loc) => set({ ...loc, detectedBy: "pincode" }),

      setFromIp: (loc) =>
        set((s) => ({
          city: loc.city,
          state: loc.state,
          // Don't overwrite a confirmed pincode with IP detection
          detectedBy: s.detectedBy === "pincode" ? "pincode" : "ip",
        })),

      clear: () =>
        set({ city: null, state: null, pincode: null, detectedBy: null }),
    }),
    { name: "ecommerce-location" },
  ),
);
