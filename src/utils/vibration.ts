/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type VibrationIntensity = 'light' | 'medium' | 'heavy' | 'tick';

/**
 * Triggers actual physical device haptic feedback as well as the screen shake custom event.
 */
export const triggerVibration = async (intensity: VibrationIntensity = 'light') => {
  // 1. Dispatch custom browser simulation shake event
  const event = new CustomEvent('phone-vibrate', { detail: { intensity } });
  window.dispatchEvent(event);

  // 2. Trigger actual physical device vibration
  try {
    switch (intensity) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'tick':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
    }
  } catch (e) {
    // Fallback to standard web vibration API
    try {
      if (navigator.vibrate) {
        const duration = {
          tick: 20,
          light: 30,
          medium: 60,
          heavy: 120,
        }[intensity] || 40;
        navigator.vibrate(duration);
      }
    } catch (webErr) {
      // Ignored if neither is supported
    }
  }
};
