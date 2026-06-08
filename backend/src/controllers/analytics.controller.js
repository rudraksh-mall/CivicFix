import Complaint from "../models/complaint.model.js";

export const getAuthorityAnalytics = async (req, res) => {
  try {
    const wardId = req.user.wardId;
    const complaints = await Complaint.find({ wardId });

    // 1. Category count
    const categoryMap = {};
    complaints.forEach((c) => {
      if (c.aiCategory) {
        categoryMap[c.aiCategory] = (categoryMap[c.aiCategory] || 0) + 1;
      }
    });

    // 2. Priority distribution
    const priority = { high: 0, medium: 0, low: 0 };
    complaints.forEach((c) => {
      if (c.priorityScore >= 65) priority.high++;
      else if (c.priorityScore >= 40) priority.medium++;
      else priority.low++;
    });

    // 3. Status breakdown - FIXED KEY FOR FRONTEND SYNC
    const status = {
      submitted: 0,
      acknowledged: 0,
      in_progress: 0, // ✅ Standardized to underscore
      resolved: 0,
    };

    complaints.forEach((c) => {
      // ✅ Normalizes hyphenated data to underscored key
      const s = c.status === "in-progress" ? "in_progress" : c.status;
      if (status.hasOwnProperty(s)) {
        status[s]++;
      }
    });

    // 4. Resolution time
    const resolved = complaints.filter((c) => c.status === "resolved");
    const avgResolutionTime =
      resolved.length === 0
        ? 0
        : resolved.reduce((sum, c) => {
            const diff =
              (new Date(c.updatedAt) - new Date(c.createdAt)) /
              (1000 * 60 * 60 * 24);
            return sum + diff;
          }, 0) / resolved.length;

    // 5. Weekly Trend (LAST 4 WEEKS)
    const trend = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);

      const weeklyComplaints = complaints.filter(
        (c) => c.createdAt >= start && c.createdAt < end
      );

      trend.push({
        label: `Week ${4 - i}`,
        reported: weeklyComplaints.length,
        resolved: weeklyComplaints.filter((c) => c.status === "resolved")
          .length,
      });
    }

    res.json({
      categoryMap,
      priority,
      status,
      avgResolutionTime: avgResolutionTime.toFixed(1),
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: "Analytics failed" });
  }
};
