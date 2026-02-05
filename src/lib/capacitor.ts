// src/lib/capacitor.ts
// Platform detection and Capacitor native bridge utilities

import { Capacitor } from '@capacitor/core';

/**
 * Whether the app is running inside a Capacitor native shell (iOS/Android).
 * Returns false on web/PWA.
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the current platform: 'ios' | 'android' | 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Check if a specific Capacitor plugin is available on the current platform.
 */
export function isPluginAvailable(name: string): boolean {
  return Capacitor.isPluginAvailable(name);
}

/**
 * Configure the native status bar (iOS/Android only).
 * Called once on app startup from the root layout.
 */
export async function configureStatusBar(): Promise<void> {
  if (!isNative() || !isPluginAvailable('StatusBar')) return;

  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Light });

  if (getPlatform() === 'android') {
    await StatusBar.setBackgroundColor({ color: '#6F00FF' });
  }
}

/**
 * Configure keyboard behavior for native platforms.
 */
export async function configureKeyboard(): Promise<void> {
  if (!isNative() || !isPluginAvailable('Keyboard')) return;

  const { Keyboard } = await import('@capacitor/keyboard');

  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open');
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
  });
}

/**
 * Register for native push notifications (iOS APNs / Android FCM).
 * Returns the device token for your backend to send targeted pushes.
 */
export async function registerNativePush(): Promise<string | null> {
  if (!isNative() || !isPluginAvailable('PushNotifications')) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return null;

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] Registration failed:', err);
      resolve(null);
    });

    PushNotifications.register();
  });
}

/**
 * Listen for incoming push notifications when the app is in the foreground.
 */
export async function addPushListeners(
  onNotification: (data: { title?: string; body?: string; data?: Record<string, unknown> }) => void,
  onAction?: (actionId: string, data?: Record<string, unknown>) => void,
): Promise<void> {
  if (!isNative() || !isPluginAvailable('PushNotifications')) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown>,
    });
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onAction?.(
      action.actionId,
      action.notification.data as Record<string, unknown>,
    );
  });
}

/**
 * Handle deep links and app URL open events.
 */
export async function addDeepLinkListener(
  onDeepLink: (url: string) => void,
): Promise<void> {
  if (!isNative() || !isPluginAvailable('App')) return;

  const { App } = await import('@capacitor/app');

  App.addListener('appUrlOpen', (event) => {
    onDeepLink(event.url);
  });
}

/**
 * Listen for app state changes (foreground/background).
 */
export async function addAppStateListener(
  onChange: (isActive: boolean) => void,
): Promise<void> {
  if (!isNative() || !isPluginAvailable('App')) return;

  const { App } = await import('@capacitor/app');

  App.addListener('appStateChange', (state) => {
    onChange(state.isActive);
  });
}

/**
 * Initialize all Capacitor native features.
 * Call this once from your root layout or app component.
 */
export async function initCapacitor(): Promise<void> {
  if (!isNative()) return;

  await configureStatusBar();
  await configureKeyboard();
}
