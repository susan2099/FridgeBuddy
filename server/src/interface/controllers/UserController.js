import { success } from '../responseFormatter.js';

export class UserController {
    constructor({ saveUserPreferenceListUseCase }) {
        if (!saveUserPreferenceListUseCase) {
            throw new Error('UserController requires a SaveUserPreferenceListUseCase');
        }
        this.saveUserPreferenceListUseCase = saveUserPreferenceListUseCase;
        this.savePreference = this.savePreference.bind(this);
        this.saveAllergen = this.saveAllergen.bind(this);
    }

    async savePreference(req, res, next) {
        try {
            const result = await this.saveUserPreferenceListUseCase.execute(req.body, 'preference');
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }

    async saveAllergen(req, res, next) {
        try {
            const result = await this.saveUserPreferenceListUseCase.execute(req.body, 'allergen');
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}
