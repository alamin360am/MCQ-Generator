import bcrypt from "bcryptjs";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  clearRefreshCookie,
  createAccessToken,
  createRefreshSession,
  getRefreshTokenFromRequest,
  hashToken,
  setRefreshCookie,
  verifyRefreshToken,
} from "../utils/authTokens.js";

const serializeUser = (user) => {
  return {
    id: user._id.toString(),

    name: user.name,

    email: user.email,

    role: user.role,

    status: user.status,

    emailVerified: Boolean(user.emailVerifiedAt),

    createdAt: user.createdAt,
  };
};

const createSessionResponse = async (user, req, res) => {
  const accessToken = createAccessToken(user);

  const refreshSession = await createRefreshSession(user, req);

  setRefreshCookie(res, refreshSession.token, refreshSession.expiresAt);

  return {
    user: serializeUser(user),
    accessToken,
  };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.exists({
    email,
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
    lastLoginAt: new Date(),
  });

  const session = await createSessionResponse(user, req, res);

  res.status(201).json({
    success: true,

    message: "Account created successfully",

    ...session,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  }).select("+passwordHash");

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new AppError(403, "This account is not active");
  }

  user.lastLoginAt = new Date();

  await user.save();

  const session = await createSessionResponse(user, req, res);

  res.json({
    success: true,

    message: "Logged in successfully",

    ...session,
  });
});

export const refreshSession = asyncHandler(async (req, res) => {
  const token = getRefreshTokenFromRequest(req);

  if (!token) {
    throw new AppError(401, "No active session");
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);

    throw new AppError(401, "Session expired");
  }

  const tokenHash = hashToken(token);

  const storedToken = await RefreshToken.findOne({
    tokenHash,

    jti: payload.jti,

    user: payload.sub,

    expiresAt: {
      $gt: new Date(),
    },
  });

  if (!storedToken) {
    clearRefreshCookie(res);

    throw new AppError(401, "Session is no longer valid");
  }

  const user = await User.findById(payload.sub);

  if (!user || user.status !== "active") {
    await RefreshToken.deleteMany({
      user: payload.sub,
    });

    clearRefreshCookie(res);

    throw new AppError(401, "Session is no longer valid");
  }

  const accessToken = createAccessToken(user);

  res.json({
    success: true,

    user: serializeUser(user),

    accessToken,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,

    user: serializeUser(req.user),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = getRefreshTokenFromRequest(req);

  if (token) {
    await RefreshToken.deleteOne({
      tokenHash: hashToken(token),
    });
  }

  clearRefreshCookie(res);

  res.json({
    success: true,

    message: "Logged out successfully",
  });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await RefreshToken.deleteMany({
    user: req.user._id,
  });

  clearRefreshCookie(res);

  res.json({
    success: true,

    message: "Logged out from all devices",
  });
});
