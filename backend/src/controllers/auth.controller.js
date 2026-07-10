const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password);

  res.cookie("refreshToken", refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: authService.msFromExpiry(process.env.JWT_REFRESH_EXPIRY),
  });

  res.status(200).json(
    new ApiResponse(true, "Login successful", { accessToken, user })
  );
});

const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;
  const { accessToken, refreshToken } = await authService.refresh(incomingToken);

  res.cookie("refreshToken", refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: authService.msFromExpiry(process.env.JWT_REFRESH_EXPIRY),
  });

  res.status(200).json(new ApiResponse(true, "Token refreshed", { accessToken }));
});

const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;
  await authService.logout(incomingToken);
  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse(true, "Logged out successfully"));
});

module.exports = { login, refresh, logout };