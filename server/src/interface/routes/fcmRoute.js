import express from 'express';

export function buildFcmRouter(fcmController) {
    if (!fcmController) {
        throw new Error('FcmController is required to build the FCM router');
    }

    const router = express.Router();
    router.post('/register-token', fcmController.registerToken);
    router.post('/send-notification', fcmController.sendNotification);
    return router;
}
