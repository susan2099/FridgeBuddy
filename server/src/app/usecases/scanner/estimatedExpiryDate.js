export function buildEstimatedExpiryDate({ fromDate, shelfLifeDays }) {
    if (!Number.isInteger(shelfLifeDays) || shelfLifeDays < 0) {
        return null;
    }

    const expiryDate = new Date(Date.UTC(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate() + shelfLifeDays
    ));

    return expiryDate.toISOString().slice(0, 10);
}
