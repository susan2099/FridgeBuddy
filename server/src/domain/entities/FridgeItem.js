export class FridgeItem {
    constructor({id, userId, name, quantity, unit, expiry, allergens = [], createdAt}) {
        this.id = id ?? null;
        this.userId = userId ?? null;
        this.name = name ?? "Unknown Item";
        this.quantity = quantity ?? 1;
        this.unit = unit ?? null;
        this.expiry = expiry ?? null;
        this.allergens = allergens ?? [];
        this.createdAt = createdAt?.toDate?.() ?? (createdAt ? new Date(createdAt) : null);
    }
}