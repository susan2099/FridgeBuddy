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
            createdAt: item.createdAt ?? new Date().toISOString()
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
}
