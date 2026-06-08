// controllers/ward.controller.js
import Ward from "../models/ward.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const lookupWard = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "lat and lng query parameters are required");
  }

  const ward = await Ward.findOne({
    boundary: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      },
    },
  });

  if (!ward) {
    return res.json(new ApiResponse(200, null, "No ward found for this location"));
  }

  return res.json(
    new ApiResponse(
      200,
      {
        wardId: ward._id,
        wardName: ward.name,
        city: ward.city,
      },
      "Ward found"
    )
  );
});

export const getWards = asyncHandler(async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.json(new ApiResponse(200, [], "City is required"));
  }

  const wards = await Ward.find({
    city: { $regex: new RegExp(`^${city}$`, "i") }, // case-insensitive
  }).select("_id name city");

  return res.json(
    new ApiResponse(200, wards, "Wards fetched successfully")
  );
});

export const getCities = asyncHandler(async (req, res) => {
  const cities = await Ward.distinct("city");

  return res.json(
    new ApiResponse(200, cities, "Cities fetched successfully")
  );
});
