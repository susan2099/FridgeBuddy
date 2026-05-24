import { ValidationError } from '../../errors.js';

const MAX_MULTICAST_TOKENS = 500;

export class FcmUseCase {
    constructor({ fcmMessageGateway, fcmTokenRepository }) {
        if (!fcmMessageGateway) {
            throw new Error('FcmUseCase requires an FcmMessageGateway');
        }
        if (!fcmTokenRepository) {
            throw new Error('FcmUseCase requires an FcmTokenRepository');
        }
        this.fcmMessageGateway = fcmMessageGateway;
        this.fcmTokenRepository = fcmTokenRepository;
    }

    async registerToken({ token, platform = 'unknown', userId } = {}) {
        const normalizedToken = typeof token === 'string' ? token.trim() : '';
        const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
        const normalizedPlatform = typeof platform === 'string' ? platform.trim() : '';

        if (!normalizedToken) {
            throw new ValidationError({ message: 'Token is required', details: { field: 'token' } });
        }
        if (platform != null && typeof platform !== 'string') {
            throw new ValidationError({ message: 'Platform must be a string', details: { field: 'platform' } });
        }
        if (!normalizedPlatform) {
            throw new ValidationError({ message: 'Platform is required', details: { field: 'platform' } });
        }
        if (!normalizedUserId) {
            throw new ValidationError({ message: 'User ID must be a non-empty string', details: { field: 'userId' } });
        }

        const record = await this.fcmTokenRepository.save({
            userId: normalizedUserId,
            token: normalizedToken,
            platform: normalizedPlatform,
        });

        return {
            message: 'Token registered successfully',
            token: record.token,
            platform: record.platform,
            userId: record.userId,
        };
    }

    async sendNotification({ title, body, userId, data = {} } = {}) {
        const normalizedTitle = typeof title === 'string' ? title.trim() : '';
        const normalizedBody = typeof body === 'string' ? body.trim() : '';
        const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';

        if (!normalizedTitle) {
            throw new ValidationError({ message: 'Title is required', details: { field: 'title' } });
        }
        if (!normalizedBody) {
            throw new ValidationError({ message: 'Body is required', details: { field: 'body' } });
        }
        if (!normalizedUserId) {
            throw new ValidationError({ message: 'User ID must be a non-empty string', details: { field: 'userId' } });
        }
        if (data != null && (typeof data !== 'object' || Array.isArray(data))) {
            throw new ValidationError({ message: 'Data must be an object', details: { field: 'data' } });
        }

        const registeredTokens = await this.fcmTokenRepository.findAllByUserId(normalizedUserId);
        if (!registeredTokens.length) {
            return { message: 'No registered token to send notification' };
        }

        const normalizedData = this.normalizeData(data);
        const firebaseResponses = [];

        for (const tokenBatch of this.chunkTokens(registeredTokens)) {
            const batchResponse = await this.fcmMessageGateway.sendMulticast({
                tokens: tokenBatch.map((registeredToken) => registeredToken.token),
                title: normalizedTitle,
                body: normalizedBody,
                data: normalizedData,
            });

            batchResponse.responses.forEach((response, index) => {
                firebaseResponses.push({
                    tokenId: tokenBatch[index].id,
                    platform: tokenBatch[index].platform,
                    success: response.success,
                    firebaseResponse: response.success ? response.messageId : null,
                    error: response.success ? null : response.error?.message,
                });
            });
        }

        return {
            message: 'Notification send completed',
            sentCount: firebaseResponses.filter((response) => response.success).length,
            failedCount: firebaseResponses.filter((response) => !response.success).length,
            firebaseResponses,
        };
    }

    normalizeData(data) {
        return Object.fromEntries(
            Object.entries(data || {}).map(([key, value]) => [key, String(value)])
        );
    }

    chunkTokens(tokens) {
        const chunks = [];
        for (let index = 0; index < tokens.length; index += MAX_MULTICAST_TOKENS) {
            chunks.push(tokens.slice(index, index + MAX_MULTICAST_TOKENS));
        }
        return chunks;
    }
}
