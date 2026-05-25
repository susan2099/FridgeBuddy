import { UserPreferenceRepository } from '../../app/ports/UserPreferenceRepository.js';

export class FirestoreUserPreferenceRepository extends UserPreferenceRepository {
    constructor({ db }) {
        super();
        if (!db) {
            throw new Error('FirestoreUserPreferenceRepository requires db');
        }
        this.db = db;
    }

    async saveList({ userId, type, items }) {
        const payload = {
            type,
            items,
            updatedAt: new Date(),
        };

        await this.collection(userId).doc(type).set(payload, { merge: true });

        return {
            userId,
            ...payload,
        };
    }

    collection(userId) {
        return this.db
            .collection('users')
            .doc(userId)
            .collection('preferences');
    }
}
