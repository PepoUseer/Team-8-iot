import { useRef, useCallback } from "react";

/**
 * useAlerts
 *
 * Hook pro detekci překročení limitů a odesílání upozornění.
 *
 * - Okamžité upozornění při prvním překročení limitu
 * - Opakování po repeatIntervalMs pokud hodnota stále překračuje
 * - Reset jakmile hodnota klesne pod limit
 * - Respektuje globální mute (muteUntil ref předaný zvenku)
 *
 * @param {(alert: AlertPayload) => void} onAlert
 * @param {{ current: number | null }} muteUntilRef  - ref na timestamp do kdy je mute aktivní
 * @param {number} repeatIntervalMs
 */

const DEFAULT_REPEAT_MS = 15 * 60 * 1000;

export const SENSOR_LABELS = {
  co2: "CO₂",
  temperature: "Temperature",
  humidity: "Humidity",
  pressure: "Pressure",
};

export const SENSOR_UNITS = {
  co2: "ppm",
  temperature: "°C",
  humidity: "%",
  pressure: "hPa",
};

export function useAlerts(
  onAlert,
  muteUntilRef,
  repeatIntervalMs = DEFAULT_REPEAT_MS,
) {
  const alertState = useRef({});

  const checkReadings = useCallback(
    (reading, limits, deviceName) => {
      if (!reading || !limits) return;

      const now = Date.now();

      // Globální mute — nekontroluj nic
      if (muteUntilRef?.current && now < muteUntilRef.current) return;

      const sensorKeys = ["co2", "temperature", "humidity", "pressure"];

      for (const key of sensorKeys) {
        const value = reading[key];
        const limit = limits[key];
        if (value == null || !limit) continue;

        const { min, max } = limit;
        const isBreaching = value < min || value > max;

        if (!alertState.current[key]) {
          alertState.current[key] = { inBreach: false, lastAlertAt: null };
        }

        const state = alertState.current[key];

        if (!isBreaching) {
          state.inBreach = false;
          state.lastAlertAt = null;
          continue;
        }

        const isFirst = !state.inBreach;
        const intervalElapsed =
          state.lastAlertAt !== null &&
          now - state.lastAlertAt >= repeatIntervalMs;

        if (isFirst || intervalElapsed) {
          state.inBreach = true;
          state.lastAlertAt = now;

          onAlert({
            id: `${key}-${now}`,
            sensorKey: key,
            label: SENSOR_LABELS[key] ?? key,
            value,
            unit: limit.unit ?? SENSOR_UNITS[key],
            min,
            max,
            deviceName: deviceName ?? "Device",
            timestamp: now,
            isRepeat: !isFirst,
          });
        }
      }
    },
    [onAlert, muteUntilRef, repeatIntervalMs],
  );

  return { checkReadings };
}
