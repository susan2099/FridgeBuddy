import { FcmTokenRepository } from '../../app/ports/FcmTokenRepository.js';

export class FirestoreFcmTokenRepository extends FcmTokenRepository {
    constructor({ db }) {
        super();
        if (!db) {
            throw new Error('FirestoreFcmTokenRepository requires db');
        }
        this.db = db;
    }

    async save({ userId, token, platform = 'unknown' }) {
        const collectionRef = this.collection(userId);
        const payload = {
            token,
            platform,
            updatedAt: new Date(),
        };
        const existing = await collectionRef.where('platform', '==', platform).limit(1).get();

        if (!existing.empty) {
            const docRef = existing.docs[0].ref;
            await docRef.update(payload);
            return { id: docRef.id, userId, ...payload };
        }

        const docRef = await collectionRef.add(payload);
        return { id: docRef.id, userId, ...payload };
    }

    async findAllByUserId(userId) {
        const snapshot = await this.collection(userId)
            .orderBy('updatedAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            userId,
            ...doc.data(),
        }));
    }

    collection(userId) {
        return this.db
            .collection('users')
            .doc(userId)
            .collection('fcmTokens');
    }
}
