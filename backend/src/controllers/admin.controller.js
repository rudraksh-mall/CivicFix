import crypto from "crypto";
import Complaint from "../models/complaint.model.js";
import { User } from "../models/user.model.js";
import Ward from "../models/ward.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { calculatePriority } from "../services/priority.service.js";

/**
 * =====================================
 * GET WARD COMPLAINTS (Authority/Admin)
 * =====================================
 */
export const getWardComplaints = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "authority" && user.role !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  const { status, category } = req.query;

  const filter = {
    wardId: user.wardId,
  };

  if (status) filter.status = status;
  if (category) filter.aiCategory = category;

  const complaints = await Complaint.find(filter)
    .sort({ priorityScore: -1 })
    .populate("reportedBy", "name email");

  res.json(
    new ApiResponse(200, complaints, "Ward complaints fetched successfully")
  );
});

/**
 * =====================================
 * UPDATE COMPLAINT STATUS (Authority)
 * =====================================
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const { complaintId } = req.params;
  const { status, remarks } = req.body;

  if (user.role !== "authority") {
    throw new ApiError(403, "Only authority can update complaint status");
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Ensure authority belongs to same ward
  if (complaint.wardId.toString() !== user.wardId) {
    throw new ApiError(403, "Not authorized for this ward");
  }

  complaint.status = status;
  complaint.authorityRemarks = remarks || complaint.authorityRemarks;
  complaint.statusUpdatedAt = new Date();

  if (status === "resolved") {
    complaint.resolvedAt = new Date();
  }

  // 🔥 Priority recalculation on status change
  complaint.priorityScore = calculatePriority(complaint);

  await complaint.save();

  res.json(
    new ApiResponse(200, complaint, "Complaint status updated successfully")
  );
});

/**
 * =====================================
 * GET ESCALATED COMPLAINTS (Admin)
 * =====================================
 */
export const getEscalations = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access only");
  }

  const days = Number(req.query.days || 3);

  const thresholdDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  );

  const escalatedComplaints = await Complaint.find({
    status: { $ne: "resolved" },
    priorityScore: { $gte: 80 },
    createdAt: { $lte: thresholdDate },
  }).sort({ priorityScore: -1 });

  res.json(
    new ApiResponse(
      200,
      escalatedComplaints,
      "Escalated complaints fetched successfully"
    )
  );
});

/**
 * =====================================
 * AUTHORITY MANAGEMENT (Admin)
 * =====================================
 */
export const getAuthorities = asyncHandler(async (req, res) => {
  const authorities = await User.find(
    { role: "authority" },
    "name email wardId isActive createdAt"
  ).populate("wardId", "name city");

  res.json(
    new ApiResponse(200, authorities, "Authorities fetched successfully")
  );
});

export const createAuthority = asyncHandler(async (req, res) => {
  const { name, email, wardId } = req.body;

  if (!name || !email || !wardId) {
    throw new ApiError(400, "Name, email, and ward are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, "A user with this email already exists");
  }

  const ward = await Ward.findById(wardId);
  if (!ward) {
    throw new ApiError(404, "Ward not found");
  }

  const tempPassword = crypto.randomBytes(12).toString("hex");

  const user = await User.create({
    name,
    email,
    password: tempPassword,
    role: "authority",
    wardId,
    isVerified: true,
    isActive: true,
    providers: ["local"],
  });

  res.json(
    new ApiResponse(201, {
      id: user._id,
      name: user.name,
      email: user.email,
      wardId: user.wardId,
      wardName: ward.name,
      city: ward.city,
      role: user.role,
      isActive: user.isActive,
      tempPassword,
    }, "Authority account created successfully")
  );
});

export const updateAuthority = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, wardId, isActive } = req.body;

  const user = await User.findById(id);
  if (!user || user.role !== "authority") {
    throw new ApiError(404, "Authority not found");
  }

  if (name !== undefined) user.name = name;
  if (wardId !== undefined) user.wardId = wardId;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.json(
    new ApiResponse(200, {
      id: user._id,
      name: user.name,
      email: user.email,
      wardId: user.wardId,
      isActive: user.isActive,
    }, "Authority updated successfully")
  );
});

export const deactivateAuthority = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user || user.role !== "authority") {
    throw new ApiError(404, "Authority not found");
  }

  user.isActive = false;
  await user.save();

  res.json(
    new ApiResponse(200, null, "Authority deactivated successfully")
  );
});