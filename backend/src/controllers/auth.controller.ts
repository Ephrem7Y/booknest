import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { catchAsync } from "../utils/catch-async.js";

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
