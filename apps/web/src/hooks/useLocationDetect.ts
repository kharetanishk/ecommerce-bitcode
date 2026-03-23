"use client";

import { useEffect } from "react";
import { useLocationStore } from "@/store/location.store";

export function useLocationDetect() {
  const { setFromIp, detectedBy } = useLocationStore();

  useEffect(() => {
    // Only auto-detect once — if user confirmed via pincode, skip
    if (detectedBy === "pincode") return;

    fetch("http://ip-api.com/json/?fields=status,city,regionName,countryCode")
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && data.countryCode === "IN") {
          setFromIp({ city: data.city, state: data.regionName });
        }
      })
      .catch(() => null); // silent fail — not critical
  }, []);
}
