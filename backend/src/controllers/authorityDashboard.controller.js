import Complaint from "../models/complaint.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAuthorityDashboard = asyncHandler(async (req, res) => {
  const user = req.user;

  // ⚠️ DO NOT change role logic
  if (user.role !== "authority") {
    return res.status(403).json({ message: "Access denied" });
  }

  const wardId = user.wardId;

  // 1. Fetch statistics for the dashboard
  const total = await Complaint.countDocuments({ wardId });

  const highPriorityCount = await Complaint.countDocuments({
    wardId,
    priorityScore: { $gte: 65 },
    status: { $ne: "resolved" },
  });

  const inProgress = await Complaint.countDocuments({
    wardId,
    status: "in_progress",
  });

  const resolvedToday = await Complaint.countDocuments({
    wardId,
    status: "resolved",
    resolvedAt: {
      $gte: new Date().setHours(0, 0, 0, 0),
    },
  });

  // 2. ✅ NEW: Fetch actual High Priority Issues for the UI card
  // This populates the empty section in your screenshot
  const highPriorityIssues = await Complaint.find({
    wardId,
    priorityScore: { $gte: 65 },
    status: { $ne: "resolved" },
  })
    .populate("wardId", "name city")
    .sort({ priorityScore: -1 })
    .limit(5)
    .lean();

  // 3. Fetch recent complaints for activity feed
  // This provides unique timestamps for each "New submission" entry
  const recent = await Complaint.find({ wardId })
    .populate("wardId", "name city")
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  res.json(
    new ApiResponse(
      200,
      {
        stats: {
          total,
          highPriority: highPriorityCount,
          inProgress,
          resolvedToday,
        },
        highPriorityIssues, // ✅ Added this to fix the empty display
        recent,
      },
      "Authority dashboard synced successfully"
    )
  );
});
