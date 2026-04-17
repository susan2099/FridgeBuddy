export class FridgeItem {
    constructor({id, userId, name, quantity, unit, expiry, allergens = [], createdAt}) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.expiry = expiry;
        this.allergens = allergens;
        this.createdAt = createdAt?.toDate?.() ?? (createdAt ? new Date(createdAt) : null);
    }
}