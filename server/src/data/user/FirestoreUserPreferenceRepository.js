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

    async getList({ userId, type }) {
        const doc = await this.collection(userId).doc(type).get();

        if (!doc.exists) {
            return {
                userId,
                type,
                items: [],
                updatedAt: null,
            };
        }

        const data = doc.data();
        return {
            userId,
            type,
            items: Array.isArray(data.items) ? data.items : [],
            updatedAt: data.updatedAt ?? null,
        };
    }

    async getAllByUserId(userId) {
        const [preference, allergen] = await Promise.all([
            this.getList({ userId, type: 'preference' }),
            this.getList({ userId, type: 'allergen' }),
        ]);

        return {
            userId,
            preference: preference.items,
            allergen: allergen.items,
            updatedAt: {
                preference: preference.updatedAt,
                allergen: allergen.updatedAt,
            },
        };
    }

    collection(userId) {
        return this.db
            .collection('users')
            .doc(userId)
            .collection('preferences');
    }
}
