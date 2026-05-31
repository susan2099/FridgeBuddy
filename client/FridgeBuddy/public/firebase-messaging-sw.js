importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDGWKp8EsPd8ro7qUoB7vTXpPNsMnJiP3Y",
  authDomain: "fridgebuddy-70f10.firebaseapp.com",
  projectId: "fridgebuddy-70f10",
  storageBucket: "fridgebuddy-70f10.firebasestorage.app",
  messagingSenderId: "664773845729",
  appId: "1:664773845729:web:a8f28193fbb52a61710da0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  self.registration.showNotification(
    payload.notification?.title || "FridgeBuddy",
    {
      body: payload.notification?.body,
      icon: "/logo.png",
      badge: "/logo.png",
    }
  );
});
