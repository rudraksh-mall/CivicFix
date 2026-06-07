import crypto from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";


import { User } from "../models/user.model.js"; // whatever file name is
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


import { generateOTP } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, "Google credential missing");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { email, name, picture, sub: googleId, email_verified } = payload;

  // Security: never trust role from frontend
  if (!email_verified) {
    throw new ApiError(400, "Google email not verified");
  }

  let user = await User.findOne({ email });
  let isNewUser = false;

  // Block deactivated accounts
  if (user && !user.isActive) {
    throw new ApiError(403, "Account has been deactivated. Contact administrator.");
  }

  // Block admin OAuth entirely
  if (user && user.role === "admin") {
    throw new ApiError(403, "Admin accounts must sign in using email and password.");
  }

  if (user) {
    // Existing user — link Google if not already linked
    if (!user.providers.includes("google")) {
      user.providers.push("google");
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      user.isVerified = true;
      await user.save();
    }
  } else {
    // Block OAuth account creation for authority/admin roles
    // Only citizens can be created via OAuth
    user = await User.create({
      name,
      email,
      avatar: picture,
      googleId,
      role: "citizen",
      wardId: null,
      isVerified: true,
      providers: ["google"],
      password: crypto.randomBytes(20).toString("hex"),
    });
    isNewUser = true;
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = crypto.randomBytes(40).toString("hex");

  await user.addRefreshSession(
    refreshToken,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    req.headers["user-agent"],
    req.ip
  );

  return res.json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        wardId: user.wardId,
      },
      accessToken,
      refreshToken,
      isNewUser,
    }, isNewUser ? "Account created successfully" : "Welcome back")
  );
});


export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, wardId } = req.body;

  if (!name || !email || !password)
    throw new ApiError(400, "Name, email & password are required");

  // Authority accounts cannot self-register
  if (role === "authority") {
    throw new ApiError(403, "Authority accounts are created by administrators. Please contact your municipal corporation.");
  }

  if (role !== "citizen") {
    throw new ApiError(400, "Invalid role");
  }

  let user = await User.findOne({ email });

  if (user && user.isVerified)
    throw new ApiError(400, "Email already registered");

  const otp = generateOTP();

  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      role: "citizen",
      wardId: null,
      isVerified: false,
      providers: ["local"],
      otp: {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      },
    });
  } else {
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await user.save();
  }

  await sendEmail(
    email,
    "CivicFix AI – Email Verification OTP",
    `<h2>Your OTP is: <b>${otp}</b></h2>`
  );

  return res.json(new ApiResponse(200,
    {
      email,
      role: "citizen",
    }
    , "OTP sent to email"));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (!user.otp?.code) throw new ApiError(400, "No OTP generated");

  if (user.otp.expiresAt < new Date()) throw new ApiError(400, "OTP expired");

  if (user.otp.code !== otp) throw new ApiError(400, "Invalid OTP");

  user.isVerified = true;
  user.otp = undefined;

  await user.save();

  return res.json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      "Email verified successfully"
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, "Email & password required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "Invalid credentials");
  if (!user.isVerified)
    throw new ApiError(401, "Please verify your email first");
  if (!user.isActive)
    throw new ApiError(403, "Account has been deactivated. Contact administrator.");
  if (!user.providers.includes("local"))
    throw new ApiError(400, "This account uses Google login. Please sign in with Google.");

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(400, "Invalid credentials");

  const accessToken = user.generateAccessToken();

  const refreshToken = crypto.randomBytes(40).toString("hex");

  await user.addRefreshSession(
    refreshToken,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    req.headers["user-agent"],
    req.ip
  );

  return res.json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          wardId: user.wardId
        },
        accessToken,
        refreshToken,
      },
      "Logged in successfully"
    )
  );
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshSessions"
  );

  return res.json(new ApiResponse(200, user, "User fetched successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new ApiError(401, "Refresh token required");

  // Get all users with refresh sessions
  const users = await User.find({ "refreshSessions.0": { $exists: true } });

  let foundUser = null;
  let foundSession = null;

  for (const user of users) {
    for (const session of user.refreshSessions) {
      const match = await bcrypt.compare(refreshToken, session.tokenHash);

      if (match) {
        foundUser = user;
        foundSession = session;
        break;
      }
    }

    if (foundUser) break;
  }

  if (!foundUser) throw new ApiError(401, "Invalid refresh token");

  if (foundSession.expiresAt < new Date())
    throw new ApiError(401, "Refresh token expired");

  // generate new access token
  const accessToken = foundUser.generateAccessToken();

  return res.json(
    new ApiResponse(200, { accessToken }, "Access token refreshed")
  );
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new ApiError(400, "Refresh token required");

  const user = await User.findById(req.user._id);

  user.refreshSessions = await Promise.all(
    user.refreshSessions.map(async (s) => {
      const match = await bcrypt.compare(refreshToken, s.tokenHash);
      return match ? null : s;
    })
  );

  user.refreshSessions = user.refreshSessions.filter(Boolean);

  await user.save();

  return res.json(new ApiResponse(200, null, "Logged out successfully"));
});
