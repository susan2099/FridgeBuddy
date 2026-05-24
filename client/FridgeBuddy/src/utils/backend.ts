import { Capacitor } from "@capacitor/core";

const BACKEND_BASE_URL = "http://localhost:3000";
const BACKEND_BASE_URL_EMULATOR = "http://10.0.2.2:3000";

export function getBackendBaseUrl() {
  return Capacitor.isNativePlatform() ? BACKEND_BASE_URL_EMULATOR : BACKEND_BASE_URL;
}

export function buildBackendUrl(path: string) {
  return `${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
