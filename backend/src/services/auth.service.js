const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const ApiError = require("../utils/ApiError");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

const msFromExpiry = (expiry) => {
  // Converts "7d" / "15m" style strings to milliseconds for cookie maxAge
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 0);
};

const login = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + msFromExpiry(process.env.JWT_REFRESH_EXPIRY)),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const refresh = async (incomingToken) => {
  if (!incomingToken) throw new ApiError(401, "Refresh token missing");

  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(403, "Invalid or expired refresh token");
  }

  const storedToken = await RefreshToken.findOne({
    token: incomingToken,
    revoked: false,
  });
  if (!storedToken) throw new ApiError(403, "Refresh token not recognized");

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(403, "User no longer active");

  // Rotate: revoke old, issue new — limits damage if a token is ever leaked
  storedToken.revoked = true;
  await storedToken.save();

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + msFromExpiry(process.env.JWT_REFRESH_EXPIRY)),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (incomingToken) => {
  if (!incomingToken) return;
  await RefreshToken.updateOne(
    { token: incomingToken },
    { $set: { revoked: true } }
  );
};

module.exports = { login, refresh, logout, msFromExpiry };