export class FcmTokenRepository {
    async save() {
        throw new Error("FcmTokenRepository.save() must be implemented");
    }

    async findAllByUserId() {
        throw new Error("FcmTokenRepository.findAllByUserId() must be implemented");
    }
}
