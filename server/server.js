import express from 'express'
import dotenv from 'dotenv'
import process from 'node:process';

import { createGeminiClient } from "./src/data/gemini/geminiClient.js";
import { GeminiRecipeGenerator } from "./src/data/gemini/GeminiRecipeGenerator.js";
import { GeminiItemNameNormalizer } from "./src/data/gemini/GeminiItemNameNormalizer.js";

import { RecipeUseCase } from "./src/app/usecases/recipe/RecipeUseCase.js";
import { RecipeController } from "./src/interface/controllers/RecipeController.js";
import { buildRecipeRouter } from "./src/interface/routes/recipeRoute.js";
import { FsFridgeRepository } from './src/data/fridge/FsFridgeRepository.js';
import { AddFridgeItemUseCase } from "./src/app/usecases/fridge/AddFridgeItemUseCase.js";
import { GetFridgeItemUseCase } from "./src/app/usecases/fridge/GetFridgeItemUseCase.js";
import { UpdateFridgeItemUseCase } from "./src/app/usecases/fridge/UpdateFridgeItemUseCase.js";
import { DeleteFridgeItemUseCase } from "./src/app/usecases/fridge/DeleteFridgeItemUseCase.js";
import { FridgeController } from "./src/interface/controllers/FridgeController.js";
import { buildFridgeRouter } from "./src/interface/routes/fridgeRoute.js";
import { OffRepository } from "./src/data/openFoodFact/OffRepository.js";
import { TabScannerRepository } from "./src/data/tabscanner/TabScannerRepository.js";
import { BarcodeScannerUseCase } from "./src/app/usecases/scanner/BarcodeScannerUseCase.js";
import { ReceiptScannerUseCase } from "./src/app/usecases/scanner/ReceiptScannerUseCase.js";
import { ScannerController } from "./src/interface/controllers/ScannerController.js";
import { buildScannerRouter } from "./src/interface/routes/scannerRoute.js";
import { errorMiddleware } from "./src/interface/errorMiddleware.js";
import { db, firebaseMessaging } from "./src/data/firebase/firebaseAdmin.js";
import { FirebaseFcmMessageGateway } from "./src/data/fcm/FirebaseFcmMessageGateway.js";
import { FirestoreFcmTokenRepository } from "./src/data/fcm/FirestoreFcmTokenRepository.js";
import { FcmUseCase } from "./src/app/usecases/fcm/FcmUseCase.js";
import { FcmController } from "./src/interface/controllers/FcmController.js";
import { buildFcmRouter } from "./src/interface/routes/fcmRoute.js";
import { FirestoreUserPreferenceRepository } from "./src/data/user/FirestoreUserPreferenceRepository.js";
import { SaveUserPreferenceListUseCase } from "./src/app/usecases/user/SaveUserPreferenceListUseCase.js";
import { GetUserPreferenceListUseCase } from "./src/app/usecases/user/GetUserPreferenceListUseCase.js";
import { UserController } from "./src/interface/controllers/UserController.js";
import { buildUserRouter } from "./src/interface/routes/userRoute.js";

import cors from 'cors';

dotenv.config()

async function fridgeBuddyBootstrap() {
    const app = express();
    app.use(express.json());
    app.use(cors());

    // Recipe generator setup
    const ai = createGeminiClient(process.env.GEMINI_API_KEY);
    const recipeGenerator = new GeminiRecipeGenerator({ai});
    const recipeUseCase = new RecipeUseCase({ recipeGenerator });
    const recipeController = new RecipeController({ recipeUseCase });
    
    // Fridge CRUD setup
    const fridgeRepository = new FsFridgeRepository();
    const addFridgeItemUseCase = new AddFridgeItemUseCase({ fridgeRepository });
    const getFridgeItemUseCase = new GetFridgeItemUseCase({ fridgeRepository });
    const updateFridgeItemUseCase = new UpdateFridgeItemUseCase({ fridgeRepository });
    const deleteFridgeItemUseCase = new DeleteFridgeItemUseCase({ fridgeRepository });
    const fridgeController = new FridgeController({
        addFridgeItemUseCase,
        getFridgeItemUseCase,
        updateFridgeItemUseCase,
        deleteFridgeItemUseCase
    });

    // Scanner setup
    const barcodeRepository = new OffRepository();
    const receiptRepository = new TabScannerRepository({ apiKey: process.env.TABSCANNER_API_KEY });
    const itemNameNormalizer = new GeminiItemNameNormalizer({ ai });
    const barcodeScannerUseCase = new BarcodeScannerUseCase({ barcodeRepository });
    const receiptScannerUseCase = new ReceiptScannerUseCase({ receiptRepository, itemNameNormalizer, fridgeRepository });
    const scannerController = new ScannerController({ barcodeScannerUseCase, receiptScannerUseCase });

    // FCM push notification setup
    const fcmMessageGateway = new FirebaseFcmMessageGateway({ firebaseMessaging });
    const fcmTokenRepository = new FirestoreFcmTokenRepository({ db });
    const fcmUseCase = new FcmUseCase({ fcmMessageGateway, fcmTokenRepository });
    const fcmController = new FcmController({ fcmUseCase });

    // User preferences setup
    const userPreferenceRepository = new FirestoreUserPreferenceRepository({ db });
    const saveUserPreferenceListUseCase = new SaveUserPreferenceListUseCase({ userPreferenceRepository });
    const getUserPreferenceListUseCase = new GetUserPreferenceListUseCase({ userPreferenceRepository });
    const userController = new UserController({
        saveUserPreferenceListUseCase,
        getUserPreferenceListUseCase
    });

    app.use('/api', buildRecipeRouter(recipeController));
    app.use('/api/fridge', buildFridgeRouter(fridgeController));
    app.use('/api/scanner', buildScannerRouter(scannerController));
    app.use('/api/fcm', buildFcmRouter(fcmController));
    app.use('/api/user', buildUserRouter(userController));
    app.use(errorMiddleware);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`API server is running on port ${PORT}`);
    });
}

fridgeBuddyBootstrap().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
