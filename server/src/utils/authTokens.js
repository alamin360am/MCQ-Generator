import crypto from "node:crypto";

import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

import { env } from "../config/env.js";
import RefreshToken from "../models/RefreshToken.js";

const TOKEN_ISSUER = "mcq-generator-api";

const ACCESS_AUDIENCE = "mcq-generator-api";

const REFRESH_AUDIENCE = "mcq-generator-refresh";

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const createAccessToken = (user) => {
  return jwt.sign(
    {
      type: "access",
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,

      issuer: TOKEN_ISSUER,
      audience: ACCESS_AUDIENCE,
    },
  );
};

export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: TOKEN_ISSUER,
    audience: ACCESS_AUDIENCE,
  });

  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }

  return payload;
};

export const createRefreshSession = async (user, req) => {
  const jti = nanoid(32);

  const token = jwt.sign(
    {
      type: "refresh",
      jti,
    },
    env.JWT_REFRESH_SECRET,
    {
      subject: user._id.toString(),

      expiresIn: env.JWT_REFRESH_EXPIRES_IN,

      issuer: TOKEN_ISSUER,
      audience: REFRESH_AUDIENCE,
    },
  );

  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    throw new Error("Could not determine refresh token expiry");
  }

  const expiresAt = new Date(decoded.exp * 1000);

  await RefreshToken.create({
    user: user._id,

    tokenHash: hashToken(token),

    jti,

    expiresAt,

    ip: req.ip || null,

    userAgent: req.get("user-agent")?.slice(0, 500) || null,
  });

  return {
    token,
    expiresAt,
  };
};

export const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: TOKEN_ISSUER,
    audience: REFRESH_AUDIENCE,
  });

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  return payload;
};

export const setRefreshCookie = (res, token, expiresAt) => {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,

    secure: env.NODE_ENV === "production",

    sameSite: "strict",

    expires: expiresAt,

    path: "/api/auth",
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,

    secure: env.NODE_ENV === "production",

    sameSite: "strict",

    path: "/api/auth",
  });
};

export const getRefreshTokenFromRequest = (req) => {
  return req.cookies[env.AUTH_COOKIE_NAME] || null;
};
