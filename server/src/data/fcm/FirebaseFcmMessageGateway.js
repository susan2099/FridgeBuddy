import { FcmMessageGateway } from '../../app/ports/FcmMessageGateway.js';

export class FirebaseFcmMessageGateway extends FcmMessageGateway {
    constructor({ firebaseMessaging }) {
        super();
        if (!firebaseMessaging) {
            throw new Error('FirebaseFcmMessageGateway requires firebaseMessaging');
        }
        this.firebaseMessaging = firebaseMessaging;
    }

    async sendMulticast({ tokens, title, body, data = {} }) {
        return await this.firebaseMessaging.sendEachForMulticast({
            tokens,
            notification: {
                title,
                body,
            },
            data,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                },
            },
        });
    }
}
