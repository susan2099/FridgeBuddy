import { Capacitor } from "@capacitor/core";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { firebaseApp } from "./firebase";
import { buildBackendUrl } from "./utils/backend";

const USER_ID_STORAGE_KEY = "fridgebuddy:user-id";

export function getOrCreateUserId() {
  const existingUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existingUserId) {
    return existingUserId;
  }

  const userId = crypto.randomUUID();
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  return userId;
}

async function sendTokenToBackend(token: string, platform: "web" | "android") {
  await fetch(buildBackendUrl("/api/fcm/register-token"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      platform,
      // userId: getOrCreateUserId(),
      userId: "test-user-1",
    }),
  });
}

export async function registerFcmToken() {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Please enable notifications to receive food expiration alerts.");
    return null;
  }

  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  await sendTokenToBackend(token, "web");
  return token;
}

export function listenFcmMessages() {
  if (Capacitor.isNativePlatform()) {
    return undefined;
  }

  const messaging = getMessaging(firebaseApp);
  const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
    const title = payload.notification?.title ?? "FridgeBuddy";
    const body = payload.notification?.body ?? "";

    new Notification(title, {
      body,
      icon: "/logo.png",
    });
  });

  return unsubscribe;
}

export async function registerTokenWithBackend(token: string, platform: "web" | "android") {
  await sendTokenToBackend(token, platform);
}

export async function sendTestNotification(title: string = "Test Notification", body: string = "This is a test notification from FridgeBuddy.") {
  const response = await fetch(buildBackendUrl("/api/fcm/send-notification"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      // userId: getOrCreateUserId(),
      userId: "test-user-1",
    }),
  });
  const result = await response.json();
  console.log("Test notification response:", result);
  return result;
}
