import { success } from '../responseFormatter.js';

export class FcmController {
    constructor({ fcmUseCase }) {
        if (!fcmUseCase) {
            throw new Error('FcmController requires an FcmUseCase');
        }
        this.fcmUseCase = fcmUseCase;
        this.registerToken = this.registerToken.bind(this);
        this.sendNotification = this.sendNotification.bind(this);
    }

    async registerToken(req, res, next) {
        try {
            const result = await this.fcmUseCase.registerToken(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }

    async sendNotification(req, res, next) {
        try {
            const result = await this.fcmUseCase.sendNotification(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}
