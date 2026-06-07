import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import { lookupWard } from "../services/ward.service";

const GPS_STORAGE_KEY = "civicfix-gps-location";

function loadPersistedGps() {
  try {
    const raw = localStorage.getItem(GPS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function persistGps(lat, lng, accuracy) {
  try {
    localStorage.setItem(
      GPS_STORAGE_KEY,
      JSON.stringify({ lat, lng, accuracy, timestamp: Date.now() })
    );
  } catch {}
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { "User-Agent": "CivicFix-AI-Project/1.0" } }
  );
  if (!res.ok) throw new Error("Nominatim API error");
  const data = await res.json();
  const city =
    data.address.city ||
    data.address.town ||
    data.address.village ||
    data.address.municipality ||
    data.address.district ||
    null;
  const locality =
    data.address.suburb ||
    data.address.neighbourhood ||
    data.address.road ||
    null;
  return { city, locality, displayName: data.display_name };
}

export function useGeolocation() {
  const watchIdRef = useRef(null);
  const mountedRef = useRef(true);

  const setGpsState = useAppStore((state) => state.setGpsState);

  const refresh = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsState({
        gpsAvailable: false,
        gpsError: "GPS not supported in this browser.",
      });
      return;
    }

    setGpsState({ gpsLoading: true });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!mountedRef.current) return;

        const { latitude, longitude, accuracy } = position.coords;

        persistGps(latitude, longitude, accuracy);

        console.log("[GPS] latitude:", latitude);
        console.log("[GPS] longitude:", longitude);
        console.log("[GPS] accuracy (meters):", accuracy);

        setGpsState({
          gpsLocation: { lat: latitude, lng: longitude },
          gpsAccuracy: accuracy,
          gpsAvailable: true,
          gpsError: null,
          gpsLoading: false,
          selectedLocation: { lat: latitude, lng: longitude },
        });

        let city = null;
        let wardData = null;

        try {
          const geo = await reverseGeocode(latitude, longitude);
          city = geo.city;
          console.log("[GPS] city matched:", city);

          if (city) {
            setGpsState({
              currentCity: city,
              currentAddress: geo.locality || city,
            });
          } else {
            setGpsState({ currentAddress: geo.locality || "Location unavailable" });
          }
        } catch (err) {
          console.warn("[GPS] Reverse geocoding failed:", err.message);
        }

        try {
          const wardRes = await lookupWard(latitude, longitude);
          if (wardRes.success && wardRes.data) {
            wardData = wardRes.data;
            console.log("[GPS] ward matched:", wardData.wardName, "| city:", wardData.city);
            setGpsState({
              currentWard: wardData,
              currentCity: wardData.city || city,
            });
          } else {
            console.log("[GPS] ward matched: none");
            setGpsState({ currentWard: null });
          }
        } catch (err) {
          console.warn("[GPS] Ward lookup failed:", err.message);
          setGpsState({ currentWard: null });
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enable GPS in your browser settings."
            : err.code === err.TIMEOUT
            ? "GPS timed out. Try again."
            : "GPS unavailable.";
        console.warn("[GPS] Error:", message);
        setGpsState({
          gpsAvailable: false,
          gpsError: message,
          gpsLoading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [setGpsState]);

  useEffect(() => {
    mountedRef.current = true;

    const persisted = loadPersistedGps();
    if (persisted) {
      setGpsState({
        gpsLocation: { lat: persisted.lat, lng: persisted.lng },
        gpsAccuracy: persisted.accuracy,
      });
    }

    refresh();

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!mountedRef.current) return;
          const { latitude, longitude, accuracy } = position.coords;
          persistGps(latitude, longitude, accuracy);
          setGpsState({
            gpsLocation: { lat: latitude, lng: longitude },
            gpsAccuracy: accuracy,
            gpsAvailable: true,
            gpsError: null,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 60000 }
      );
    }

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [refresh, setGpsState]);

  return { refresh };
}
