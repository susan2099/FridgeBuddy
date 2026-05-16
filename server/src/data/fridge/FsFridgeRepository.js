import { db } from '../firebase/firebaseAdmin.js';
import { FridgeRepository } from '../../app/ports/FridgeRepository.js';
import { FridgeItem } from '../../domain/entities/FridgeItem.js';

export class FsFridgeRepository extends FridgeRepository {
    async add(item) {
        const payload = {
            name: item.name,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            expiry: item.expiry ?? null,
            allergens: item.allergens ?? [],
            createdAt: item.createdAt ?? new Date()
        }
        const docRef = await db
            .collection('users')
            .doc(item.userId)
            .collection('items')
            .add(payload);

        return new FridgeItem({
            id: docRef.id,
            userId: item.userId,
            ...payload
        })
    }

    async getAllByUserId(userId) {
        const snapshot = await db
            .collection('users')
            .doc(userId)
            .collection('items')
            .orderBy('createdAt', 'desc')
            .get();

        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return new FridgeItem({
                id: doc.id,
                userId,
                name: data.name,
                quantity: data.quantity,
                unit: data.unit,
                expiry: data.expiry,
                allergens: data.allergens,
                createdAt: data.createdAt
            });
        });
        return items;
    }

    async updateById({ userId, itemId, updates }) {
        const docRef = db
            .collection('users')
            .doc(userId)
            .collection('items')
            .doc(itemId);

        await docRef.update(updates);

        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();

        return new FridgeItem({
            id: updatedDoc.id,
            userId,
            name: data.name,
            quantity: data.quantity,
            unit: data.unit,
            expiry: data.expiry,
            allergens: data.allergens,
            createdAt: data.createdAt
        });
    }

    async deleteById({ userId, itemId }) {
        const docRef = db
            .collection('users')
            .doc(userId)
            .collection('items')
            .doc(itemId);

        await docRef.delete();

        return {
            userId,
            itemId,
            deleted: true
        };
    }
}
