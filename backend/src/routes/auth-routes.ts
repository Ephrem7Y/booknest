import { Router } from "express";

import { register } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import { registerSchema } from "../schemas/auth.schema.js";

const authRouter = Router();

// Create a customer account after validating the request body.
authRouter.post("/register", validateRequest(registerSchema), register);

export default authRouter;
