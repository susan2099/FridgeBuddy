const express = require("express");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const readline = require("readline");

const app = express();
const PORT = 3000;
const DATA_FILE = "./fridge.yaml";

app.use(express.json());

/* ======================
   YAML FILE HELPERS
====================== */

async function readFridge() {
  try {
    const fileContents = await fs.readFile(DATA_FILE, "utf8");
    return yaml.load(fileContents) || { items: [] };
  } catch (err) {
    return { items: [] };
  }
}

async function writeFridge(data) {
  const yamlData = yaml.dump(data, { indent: 2 });
  await fs.writeFile(DATA_FILE, yamlData);
}

/* ======================
   TERMINAL INPUT (CLI)
====================== */

function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function promptForItem() {
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

  const newItem = {
    id: Date.now(),
    name,
    quantity: Number(quantityInput) || 1,
    expiry: expiry || null,
    addedAt: new Date().toISOString()
  };

  fridge.items.push(newItem);
  await writeFridge(fridge);

  console.log("Item added:", newItem, "\n");
}

/* ======================
   ROUTES
====================== */

app.get("/", async (req, res) => {
  const fridge = await readFridge();

  const itemsHtml = fridge.items.length
    ? fridge.items
        .map(
          item => `
            <li>
              <strong>${item.name}</strong>
              — Qty: ${item.quantity}
              ${item.expiry ? `— Exp: ${item.expiry}` : ""}
            </li>
          `
        )
        .join("")
    : "<li>No items yet. Add some from the terminal</li>";

  res.send(`
    <html>
      <head>
        <title>FridgeBuddy</title>
      </head>
      <body>
        <h1>FridgeBuddy</h1>
        <p>Add items via the terminal.</p>
        <ul>${itemsHtml}</ul>
      </body>
    </html>
  `);
});

/* ======================
   SERVER START
====================== */

app.listen(PORT, async () => {
  console.log(`FridgeBuddy server running at http://localhost:${PORT}`);
  await promptForItem();
});