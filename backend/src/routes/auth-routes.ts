import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const authRouter = Router();
// Create a customer account after validating the request body.
authRouter.post("/register", validateRequest(registerSchema), register);
// Check credentials and issue an access token.
authRouter.post("/login", validateRequest(loginSchema), login);

export default authRouter;
