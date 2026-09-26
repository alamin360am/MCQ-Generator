import User from "../models/User.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { verifyAccessToken } from "../utils/authTokens.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }

  const token = authorization.slice(7);

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Your session has expired");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new AppError(401, "User account no longer exists");
  }

  if (user.status !== "active") {
    throw new AppError(403, "This account is not active");
  }

  req.user = user;

  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next();
  }

  const token = authorization.slice(7);

  try {
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);

    if (user && user.status === "active") {
      req.user = user;
    }
  } catch {
    // Public request:
    // invalid/expired access token
    // simply continues as guest.
  }

  next();
});
