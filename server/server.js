import express from 'express'
import dotenv from 'dotenv'
import fs from "fs-extra";
import yaml from "js-yaml";
import readline from "readline";
import process from 'node:process';

import { createGeminiClient } from "./src/data/gemini/geminiClient.js";
import { GeminiRecipeGenerator } from "./src/data/gemini/GeminiRecipeGenerator.js";

import { RecipeUseCase } from "./src/app/usecases/recipe/RecipeUseCase.js";
import { RecipeController } from "./src/interface/controllers/RecipeController.js";
import { buildRecipeRouter } from "./src/interface/routes/recipeRoute.js";
import { FsFridgeRepository } from './src/data/fridge/FsFridgeRepository.js';
import { AddFridgeItemUseCase } from "./src/app/usecases/fridge/AddFridgeItemUseCase.js";
import { GetFridgeItemUseCase } from "./src/app/usecases/fridge/GetFridgeItemUseCase.js";
import { FridgeController } from "./src/interface/controllers/FridgeController.js";
import { buildFridgeRouter } from "./src/interface/routes/fridgeRoute.js";
import { errorMiddleware } from "./src/interface/errorMiddleware.js";

import cors from 'cors';

dotenv.config()

const app = express();

async function readFridge() {
  try {
    const fileContents = await fs.readFile(process.env.DATA_FILE_PATH, "utf8");
    return yaml.load(fileContents) || [];
  } catch (error) {
    console.error("Error reading fridge data:", error);
    return [];
  }
}

async function writeFridge(data) {
  const yamlData = yaml.dump(data, { indent: 2 });
  await fs.writeFile(process.env.DATA_FILE_PATH, yamlData);
}

/* ======================
   TERMINAL INPUT (CLI)
====================== */

function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ======================
// CLI ADD/DELETE HELPERS
// ======================

async function addItemCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\nAdd a fridge item (leave name empty to cancel)\n");

  const name = await askQuestion(rl, "Item name: ");
  if (!name) {
    rl.close();
    console.log("Cancelled\n");
    return;
  }

  const quantityInput = await askQuestion(
    rl,
    "Quantity (default 1): "
  );
  const expiry = await askQuestion(
    rl,
    "Expiry date (YYYY-MM-DD, optional): "
  );

  rl.close();

  const fridge = await readFridge();

  // generate a simple numeric ID by taking the max existing id and adding 1
  const nextId = fridge.length
    ? Math.max(...fridge.map(i => i.id)) + 1
    : 1;

  const newItem = {
    id: nextId,
    name,
    quantity: Number(quantityInput) || 1,
    expiry: expiry || null,
    addedAt: new Date().toISOString()
  };

  fridge.push(newItem);
  await writeFridge(fridge);

  console.log("Item added:", newItem, "\n");
}

async function deleteItemCLI() {
  const fridge = await readFridge();
  if (!fridge.length) {
    console.log("No items to delete.\n");
    return;
  }

  console.log("\nCurrent fridge items:");
  fridge.forEach((item, idx) => {
    console.log(
      `${idx + 1}) ${item.name} (qty ${item.quantity})${
        item.expiry ? ` exp ${item.expiry}` : ""
      } [id=${item.id}]`
    );
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const idxInput = await askQuestion(
    rl,
    "Enter the number of the item to delete (leave empty to cancel): "
  );
  rl.close();

  if (!idxInput) {
    console.log("Deletion cancelled\n");
    return;
  }

  const index = Number(idxInput) - 1;
  if (index < 0 || index >= fridge.length) {
    console.log("Invalid selection.\n");
    return;
  }

  const removed = fridge.splice(index, 1)[0];
  await writeFridge(fridge);
  console.log(`Item ${removed.id} (${removed.name}) deleted.\n`);
}

async function promptActionCLI() {
  while (true) {
    const fridge = await readFridge();

    if (!fridge.length) {
      console.log("No items in fridge yet.\n");
      await addItemCLI();
      continue; // ask again after adding
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const action = await askQuestion(
      rl,
      "Would you like to (a)dd, (d)elete an item, or (q)uit? (leave blank to quit): "
    );
    rl.close();

    if (!action || action.toLowerCase().startsWith("q")) {
      console.log("Exiting CLI prompts.\n");
      break;
    }

    if (action.toLowerCase().startsWith("a")) {
      await addItemCLI();
    } else if (action.toLowerCase().startsWith("d")) {
      await deleteItemCLI();
    } else {
      console.log("No valid action selected.\n");
    }
  }
}

/* ======================
   SERVER START
====================== */

app.listen(process.env.CRUD_PORT, async () => {
  console.log(`FridgeBuddy server running at http://localhost:${process.env.CRUD_PORT}`);
  await promptActionCLI();
});

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
    const fridgeController = new FridgeController({ addFridgeItemUseCase, getFridgeItemUseCase });

    app.use('/api', buildRecipeRouter(recipeController));
    app.use('/api/fridge', buildFridgeRouter(fridgeController));
    app.use(errorMiddleware);

    const PORT = process.env.RECIPE_GENERATOR_PORT || 4000;

    app.listen(PORT, () => {
        console.log(`API server is running on port ${PORT}`);
    });
}

fridgeBuddyBootstrap().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});