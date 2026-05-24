import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
} from "@capacitor/push-notifications";
import type {
  ActionPerformed,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import { registerTokenWithBackend } from "./fcm";

export async function registerNativePushToken() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== "granted") {
    alert("Please enable notifications to receive food expiration alerts.");
    return null;
  }

  await PushNotifications.register();

  return null;
}

export function listenNativePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  const registrationListener = PushNotifications.addListener("registration", async (token: Token) => {
    await registerTokenWithBackend(token.value, "android");
  });

  const registrationErrorListener = PushNotifications.addListener("registrationError", (error) => {
    console.error("Android push registration error:", error);
  });

  const notificationReceivedListener = PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      console.log("Android foreground notification:", notification);
    },
  );

  const actionPerformedListener = PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: ActionPerformed) => {
      console.log("Notification clicked:", action);
    },
  );

  return () => {
    void registrationListener.then((listener) => listener.remove());
    void registrationErrorListener.then((listener) => listener.remove());
    void notificationReceivedListener.then((listener) => listener.remove());
    void actionPerformedListener.then((listener) => listener.remove());
  };
}
