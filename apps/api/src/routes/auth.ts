import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateMiddleware } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, oauthSchema } from "@ecommerce/validators";
import {
  loginUser,
  logoutUser,
  me,
  register,
  oauthUser,
} from "../controllers/auth.controller";

const authRouter: Router = Router();

authRouter.post("/register", validateMiddleware(registerSchema), register);
authRouter.post("/login", validateMiddleware(loginSchema), loginUser);
authRouter.post("/oauth", validateMiddleware(oauthSchema), oauthUser);
authRouter.post("/logout", logoutUser);
authRouter.get("/me", authMiddleware, me);

export default authRouter;
