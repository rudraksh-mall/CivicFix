import mongoose from "mongoose";
import Ward from "./models/ward.model.js";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";

dotenv.config();

const lucknowWards = [
  {
    name: "Hazratganj / Ward 1",
    city: "Lucknow",
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.93, 26.84],
          [80.95, 26.84],
          [80.95, 26.86],
          [80.93, 26.86],
          [80.93, 26.84],
        ],
      ],
    },
  },
  {
    name: "Gomti Nagar / Ward 2",
    city: "Lucknow",
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.97, 26.83],
          [81.01, 26.83],
          [81.01, 26.87],
          [80.97, 26.87],
          [80.97, 26.83],
        ],
      ],
    },
  },
  {
    name: "Aliganj / Ward 3",
    city: "Lucknow",
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.92, 26.88],
          [80.96, 26.88],
          [80.96, 26.92],
          [80.92, 26.92],
          [80.92, 26.88],
        ],
      ],
    },
  },
  {
    name: "Indira Nagar / Ward 4",
    city: "Lucknow",
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.98, 26.87],
          [81.02, 26.87],
          [81.02, 26.91],
          [80.98, 26.91],
          [80.98, 26.87],
        ],
      ],
    },
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}?dbName=${DB_NAME}`);
    console.log("Connected to MongoDB...");

    // Clear old wards to avoid duplicates
    await Ward.deleteMany({});

    // Create the 2dsphere index (MANDATORY for Geo-Spatial queries)
    await Ward.collection.createIndex({ boundary: "2dsphere" });

    await Ward.insertMany(lucknowWards);
    console.log("✅ Lucknow Test Wards Seeded!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
