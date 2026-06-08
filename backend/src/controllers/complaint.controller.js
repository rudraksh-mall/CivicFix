import Complaint from "../models/complaint.model.js";
import Ward from "../models/ward.model.js";
import Vote from "../models/vote.model.js"; // Import needed for Discovery synchronization
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { validateDescription } from "../utils/validateDescription.js";

// Services
import { analyzeComplaintWithAI } from "../services/ai.service.js";
import { calculatePriority } from "../services/priority.service.js";

/**
 * CREATE COMPLAINT (Citizen)
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role !== "citizen") {
    throw new ApiError(403, "Only citizens can report complaints");
  }

  const { description, location } = req.body;
  const imageUrl = req.imageUrl;

  if (!description || !imageUrl || !location?.lat || !location?.lng) {
    throw new ApiError(400, "Description, image and location are required");
  }

  const isValidDescription = validateDescription(description);

  if (!isValidDescription) {
    throw new ApiError(
      400,
      "Please enter a relevant civic issue description"
    );
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  const ward = await Ward.findOne({
    boundary: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
      },
    },
  });

  if (!ward) throw new ApiError(404, "Ward not found for this location");

  const aiResult = await analyzeComplaintWithAI({ imageUrl, description });

  if (aiResult.isRelevant === false) {
    throw new ApiError(400, aiResult.rejectionReason || "Image rejected. Please upload a photo of a valid civic issue.");
  }

  if (aiResult.descriptionMatches === false) {
    throw new ApiError(400, aiResult.mismatchReason || "The uploaded image and description appear to describe different issues. Please ensure the description matches what is visible in the image.");
  }

  if (aiResult.aiUnavailable) {
    throw new ApiError(503, "AI image verification is temporarily unavailable. Please try again later.");
  }

  const aiCategory = aiResult.category;
  const aiSeverity = aiResult.severity;
  const aiKeywords = aiResult.keywords;
  const aiStatus = "ai";
  const aiConfidence = aiResult.confidence;


  const complaint = await Complaint.create({
    reportedBy: user._id,
    description,
    imageUrl,
    location: { lat, lng },
    wardId: ward._id,
    aiCategory,
    aiSeverity,
    aiKeywords,
    aiStatus,
    aiConfidence,
  });

  complaint.priorityScore = calculatePriority(complaint);
  await complaint.save();

  return res
    .status(201)
    .json(new ApiResponse(201, complaint, "Complaint submitted successfully"));
});

/**
 * Haversine distance in kilometers between two lat/lng points.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET ALL COMPLAINTS (Community Discovery)
 * Supports scope query param: nearby | trending | ward | city
 * - nearby: filter by radius from provided lat/lng, sort by distance
 * - trending: sort by upvoteCount descending
 * - ward: filter by wardId
 * - city: filter by ward city name
 */
export const getAllComplaints = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { scope, lat, lng, wardId, city, radius } = req.query;

  let filter = {};
  let sortOption = { createdAt: -1 };

  const getCityWardIds = async (cityName) => {
    if (!cityName) return [];
    const wards = await Ward.find({ city: new RegExp(cityName, "i") }, "_id");
    return wards.map((w) => w._id);
  };

  if (scope === "ward" && wardId) {
    filter.wardId = wardId;
  } else if (scope === "city" && city) {
    const wardIds = await getCityWardIds(city);
    filter.wardId = { $in: wardIds };
  } else if (scope === "trending") {
    sortOption = { upvoteCount: -1, createdAt: -1 };
    if (city) {
      const wardIds = await getCityWardIds(city);
      if (wardIds.length) filter.wardId = { $in: wardIds };
    }
  } else if (scope === "nearby" && lat && lng) {
    if (city) {
      const wardIds = await getCityWardIds(city);
      if (wardIds.length) filter.wardId = { $in: wardIds };
    }
  }

  let complaints = await Complaint.find(filter)
    .populate("wardId", "name city")
    .sort(sortOption)
    .lean();

  if (scope === "nearby" && lat && lng) {
    const refLat = parseFloat(lat);
    const refLng = parseFloat(lng);
    const selectedRadius = parseFloat(radius) || 5;

    console.log("[Nearby] User coordinates:", refLat, refLng);
    console.log("[Nearby] Radius selected:", selectedRadius, "km");
    console.log("[Nearby] Total complaints before filter:", complaints.length);

    complaints = complaints
      .map((c) => {
        const distKm = haversineKm(refLat, refLng, c.location.lat, c.location.lng);
        console.log(
          `[Nearby]  complaint ${c._id} at (${c.location.lat}, ${c.location.lng}) — distance: ${distKm.toFixed(1)} km`
        );
        return { ...c, _distance: distKm };
      })
      .filter((c) => c._distance <= selectedRadius)
      .sort((a, b) => a._distance - b._distance);

    console.log("[Nearby] Complaints within radius:", complaints.length);
  }

  const complaintsWithVoteStatus = await Promise.all(
    complaints.map(async (complaint) => {
      let hasUpvoted = false;

      if (userId) {
        const userVote = await Vote.findOne({
          complaintId: complaint._id,
          userId,
        });
        hasUpvoted = !!userVote;
      }

      return {
        ...complaint,
        hasUpvoted,
      };
    })
  );

  return res.json(
    new ApiResponse(200, complaintsWithVoteStatus, "Fetched all complaints")
  );
});


/**
 * GET COMPLAINT BY ID
 * UPDATED: Injects vote status for individual detail view
 */
// Example for your GET /api/complaint/:id route
export const getComplaintById = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const userId = req.user._id;

  console.log(complaintId);
  

  console.log(userId);
  

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  // Check the Votes collection for this specific user and complaint
  const userVote = await Vote.findOne({
    complaintId,
    userId,
  });

  // Send the correct 'hasUpvoted' status so the frontend initializes correctly
  return res.json(
    new ApiResponse(200, {
      ...complaint._doc,
      hasUpvoted: !!userVote, // true if record exists, false otherwise
    })
  );
});
/**
 * UPDATE STATUS (Authority Only)
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const { status, authorityRemarks } = req.body;
  const afterFixImageUrl = req.imageUrl;

  if (user.role !== "authority") throw new ApiError(403, "Unauthorized");
  if (!status) throw new ApiError(400, "Status is required");

  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint) throw new ApiError(404, "Not found");

  if (!complaint.wardId.equals(user.wardId)) {
    throw new ApiError(403, "This complaint belongs to a different ward");
  }

  complaint.status = status;
  complaint.authorityRemarks = authorityRemarks || complaint.authorityRemarks;

  if (status === "resolved") {
    if (!afterFixImageUrl) throw new ApiError(400, "After-fix image required");
    complaint.afterFixImageUrl = afterFixImageUrl;
    complaint.resolvedAt = new Date();
  }

  await complaint.save();
  res.json(new ApiResponse(200, complaint, "Status updated"));
});

/**
 * EDIT COMPLAINT (Citizen)
 */
export const updateComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { description, location } = req.body;
  const userId = req.user._id;
  const newImageUrl = req.imageUrl;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  if (complaint.reportedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to edit this report");
  }

  if (complaint.status !== "submitted") {
    throw new ApiError(
      400,
      "Cannot edit a report already in progress or resolved"
    );
  }

  if (description) complaint.description = description;
  if (newImageUrl) complaint.imageUrl = newImageUrl;

  if (location?.lat && location?.lng) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    complaint.location = { lat, lng };

    const newWard = await Ward.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
        },
      },
    });
    if (newWard) complaint.wardId = newWard._id;
  }

  const aiResult = await analyzeComplaintWithAI({
    imageUrl: complaint.imageUrl,
    description: complaint.description,
  });

  if (aiResult.isRelevant === false) {
    throw new ApiError(400, aiResult.rejectionReason || "Updated image rejected. Please upload a photo of a valid civic issue.");
  }

  if (aiResult.descriptionMatches === false) {
    throw new ApiError(400, aiResult.mismatchReason || "The uploaded image and description appear to describe different issues. Please ensure the description matches what is visible in the image.");
  }

  if (aiResult.aiUnavailable) {
    throw new ApiError(503, "AI image verification is temporarily unavailable. Please try again later.");
  }

  complaint.aiCategory = aiResult.category;
  complaint.aiSeverity = aiResult.severity;
  complaint.aiKeywords = aiResult.keywords;
  complaint.aiConfidence = aiResult.confidence;
  complaint.priorityScore = calculatePriority(complaint);

  await complaint.save();
  res.json(
    new ApiResponse(200, complaint, "Complaint fully updated successfully")
  );
});

/**
 * DELETE COMPLAINT
 */
export const deleteComplaint = asyncHandler(async (req, res) => {
  const user = req.user;
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  if (user.role === "citizen") {
    if (complaint.reportedBy.toString() !== user._id.toString()) {
      throw new ApiError(403, "Unauthorized");
    }
    if (complaint.status !== "submitted") {
      throw new ApiError(400, "Cannot delete active reports");
    }
  }

  await Complaint.findByIdAndDelete(complaintId);
  res.json(new ApiResponse(200, null, "Deleted successfully"));
});

/**
 * ADDITIONAL GETTERS
 */
export const getWardComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ wardId: req.user.wardId })
    .populate("wardId", "name city")
    .sort({ priorityScore: -1, createdAt: -1 });
  res.json(new ApiResponse(200, complaints, "Success"));
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const complaints = await Complaint.find({ reportedBy: userId })
    .populate("wardId", "name city")
    .sort({ createdAt: -1 })
    .lean();

  const complaintsWithVoteStatus = await Promise.all(
    complaints.map(async (complaint) => {
      let hasUpvoted = false;
      const userVote = await Vote.findOne({ complaintId: complaint._id, userId });
      hasUpvoted = !!userVote;
      return { ...complaint, hasUpvoted };
    })
  );

  res.json(new ApiResponse(200, complaintsWithVoteStatus, "Success"));
});
