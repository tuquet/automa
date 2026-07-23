import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the raw tasks dictionary from Automa's shared.js
import { tasks } from 'file:///C:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-ex/src/utils/shared.js';

// Define the output path for the pristine knowledge dictionary
const outPath = path.join(__dirname, '../resources/shared_blocks.json');

// Write the JSON to file without modifying it
fs.writeFileSync(outPath, JSON.stringify(tasks, null, 2));

console.log(`Successfully extracted ${Object.keys(tasks).length} block definitions from shared.js into shared_blocks.json.`);
