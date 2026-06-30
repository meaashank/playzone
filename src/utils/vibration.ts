/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VibrationIntensity = 'light' | 'medium' | 'heavy' | 'tick';

/**
 * Triggers a simulated browser phone vibration (shake effect).
 * Has no effect if vibration is disabled in settings.
 */
export const triggerVibration = (intensity: VibrationIntensity = 'light') => {
  const event = new CustomEvent('phone-vibrate', { detail: { intensity } });
  window.dispatchEvent(event);
};
