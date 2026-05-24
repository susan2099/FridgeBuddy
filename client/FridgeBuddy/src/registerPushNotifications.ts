import { Capacitor } from "@capacitor/core";
import { registerFcmToken, listenFcmMessages } from "./fcm";
import { registerNativePushToken, listenNativePushNotifications } from "./nativePush";

export function registerPushNotifications() {
  let cancelled = false;
  let cleanup: (() => void) | undefined;

  const initialize = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        cleanup = listenNativePushNotifications();
        if (!cancelled) {
          await registerNativePushToken();
        }
        return;
      }

      const unsubscribe = listenFcmMessages();
      cleanup = () => {
        unsubscribe?.();
      };

      if (!cancelled) {
        await registerFcmToken();
      }
    } catch (error) {
      console.error(error);
    }
  };

  void initialize();

  return () => {
    cancelled = true;
    cleanup?.();
  };
}
