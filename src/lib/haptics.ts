import { Capacitor } from '@capacitor/core';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

interface HapticPatterns {
  [key: string]: number[];
}

const patterns: HapticPatterns = {
  light: [10],
  medium: [20],
  heavy: [30],
  selection: [5],
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
  tap: [8],
  doubleTap: [8, 40, 8],
  impact: [15],
  notification: [10, 30, 10, 30, 15],
};

/**
 * Use native Capacitor Haptics on iOS/Android, falling back to navigator.vibrate on web.
 */
async function nativeHaptic(style: HapticStyle): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Haptics')) {
    return false;
  }

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

    switch (style) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'selection':
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
    return true;
  } catch {
    return false;
  }
}

function webVibrate(pattern: number[]): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export const haptic = {
  trigger: async (style: HapticStyle = 'light') => {
    if (typeof window === 'undefined') return;

    const handled = await nativeHaptic(style);
    if (!handled) {
      webVibrate(patterns[style] || patterns.light);
    }
  },

  light: () => haptic.trigger('light'),
  medium: () => haptic.trigger('medium'),
  heavy: () => haptic.trigger('heavy'),
  selection: () => haptic.trigger('selection'),
  success: () => haptic.trigger('success'),
  warning: () => haptic.trigger('warning'),
  error: () => haptic.trigger('error'),

  tap: async () => {
    if (typeof window === 'undefined') return;
    const handled = await nativeHaptic('light');
    if (!handled) webVibrate(patterns.tap);
  },

  doubleTap: async () => {
    if (typeof window === 'undefined') return;
    const handled = await nativeHaptic('medium');
    if (!handled) webVibrate(patterns.doubleTap);
  },

  impact: async () => {
    if (typeof window === 'undefined') return;
    const handled = await nativeHaptic('heavy');
    if (!handled) webVibrate(patterns.impact);
  },

  notification: async () => {
    if (typeof window === 'undefined') return;
    const handled = await nativeHaptic('success');
    if (!handled) webVibrate(patterns.notification);
  },

  custom: (pattern: number[]) => {
    if (typeof window === 'undefined') return;
    webVibrate(pattern);
  },

  stop: () => {
    if (typeof window === 'undefined') return;
    if ('vibrate' in navigator) navigator.vibrate(0);
  },
};

export default haptic;
