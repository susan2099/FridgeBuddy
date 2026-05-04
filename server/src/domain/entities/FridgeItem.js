export class FridgeItem {
    constructor({id, userId, name, quantity, unit, expiry, allergens = [], createdAt}) {
<<<<<<< HEAD
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.expiry = expiry;
        this.allergens = allergens;
=======
        this.id = id ?? null;
        this.userId = userId ?? null;
        this.name = name ?? "Unknown Item";
        this.quantity = quantity ?? 1;
        this.unit = unit ?? null;
        this.expiry = expiry ?? null;
        this.allergens = allergens ?? [];
>>>>>>> main
        this.createdAt = createdAt?.toDate?.() ?? (createdAt ? new Date(createdAt) : null);
    }
}