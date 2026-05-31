import { success } from '../responseFormatter.js';

export class UserController {
    constructor({ saveUserPreferenceListUseCase, getUserPreferenceListUseCase }) {
        if (!saveUserPreferenceListUseCase) {
            throw new Error('UserController requires a SaveUserPreferenceListUseCase');
        }
        if (!getUserPreferenceListUseCase) {
            throw new Error('UserController requires a GetUserPreferenceListUseCase');
        }
        this.saveUserPreferenceListUseCase = saveUserPreferenceListUseCase;
        this.getUserPreferenceListUseCase = getUserPreferenceListUseCase;
        this.savePreference = this.savePreference.bind(this);
        this.saveAllergen = this.saveAllergen.bind(this);
        this.getPreferences = this.getPreferences.bind(this);
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

    async getPreferences(req, res, next) {
        try {
            const result = await this.getUserPreferenceListUseCase.execute(req.query);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}
