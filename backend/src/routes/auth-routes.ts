import { Router } from "express";
import {
  getCurrentUser,
  login,
  register,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const authRouter = Router();
// Create a customer account after validating the request body.
authRouter.post("/register", validateRequest(registerSchema), register);
// Check credentials and issue an access token.
authRouter.post("/login", validateRequest(loginSchema), login);
// Return the currently logged-in user. Requires a valid access token.
authRouter.get("/me", authenticate, getCurrentUser);

export default authRouter;
