import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import { catchAsync } from "../utils/catch-async.js";
import type { AuthenticatedUser } from "../utils/jwt.js";

// Handles POST /auth/register.
export const register = catchAsync(async (req, res) => {
  // validateRequest has already replaced req.body with the cleaned, validated data.
  const input = req.body as RegisterInput;
  const user = await registerUser(input);
  return res.status(201).json({
    message: "Account created successfully!",
    user,
  });
});

// Handles POST /auth/login.
export const login = catchAsync(async (req, res) => {
  // validateRequest has already replaced req.body with the cleaned, validated data.
  const input = req.body as LoginInput;
  const { token, expiresIn, user } = await loginUser(input);
  // This response contains a token, so tell browsers and proxies never to store it.
  res.set("Cache-Control", "no-store");
  return res.status(200).json({
    message: "Logged in successfully!",
    token,
    expiresIn,
    user,
  });
});

// Handles GET /auth/me.
export const getCurrentUser = catchAsync(async (_req, res) => {
  // authenticate has already verified the token and stored the identity here.
  const { id } = res.locals.user as AuthenticatedUser;
  const user = await getUserById(id);
  return res.status(200).json({
    message: "Current user retrieved successfully!",
    user,
  });
});
