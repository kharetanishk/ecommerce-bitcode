import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  oauthSchema,
} from "@ecommerce/validators";
import {
  loginUser,
  logoutUser,
  me,
  register,
  oauthUser,
} from "../controllers/auth.controller";

const authRouter: Router = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.post("/oauth", validate(oauthSchema), oauthUser);
authRouter.post("/logout", logoutUser);
authRouter.get("/me", authenticate, me);

export default authRouter;
