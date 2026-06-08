import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Ward from "../src/models/ward.model.js";
import { DB_NAME } from "../src/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

await mongoose.connect(`${process.env.MONGODB_URI}?dbName=${DB_NAME}`);
console.log("Connected to DB:", mongoose.connection.name);

const CITIES = {
  prayagraj: { file: "prayagraj.geojson", name: "Prayagraj" },
  gorakhpur: { file: "gorakhpur.geojson", name: "Gorakhpur" },
};

const cityArg = process.argv.find((a) => a.startsWith("--city="));
const selected = cityArg ? [cityArg.split("=")[1].toLowerCase()] : Object.keys(CITIES);

async function importCity(city) {
  const config = CITIES[city];
  if (!config) return console.log(`⚠️ Unknown city: ${city}`);

  const filePath = path.resolve(__dirname, "../data", config.file);
  if (!fs.existsSync(filePath)) return console.log(`⚠️ File not found: ${filePath}`);

  const geojson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let inserted = 0;
  let skipped = 0;

  for (const feature of geojson.features) {
    const wardName = `Ward ${feature.properties.ward_no} – ${feature.properties.ward_name}`;
    const exists = await Ward.findOne({ city: config.name, name: wardName });

    if (exists) { skipped++; continue; }

    await Ward.create({
      name: wardName,
      city: config.name,
      boundary: feature.geometry,
      admins: [],
    });
    inserted++;
  }

  console.log(`📌 ${config.name}: Inserted ${inserted}, Skipped ${skipped}`);
  return inserted;
}

async function importAll() {
  let total = 0;
  for (const city of selected) {
    total += await importCity(city);
  }

  await Ward.collection.createIndex({ boundary: "2dsphere" });
  console.log("✅ 2dsphere index verified on boundary field");
  console.log(`✅ Total new wards imported: ${total}`);
  process.exit(0);
}

importAll().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
