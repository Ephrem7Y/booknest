import type { RegisterInput } from "../schemas/auth.schema.js";
import { registerUser } from "../services/auth.service.js";
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
