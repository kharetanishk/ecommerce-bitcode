import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { setTokenCookie, signtoken } from "../utils/token";
import { AuthRequest } from "../middleware/auth.middleware";
import { log } from "../middleware/logger.middleware";

//register user controller
async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    const token = signtoken(user.id);
    setTokenCookie(res, token);

    log.success("auth:register", "User registered successfully", user);
    res.status(201).json({
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    log.error("auth:register", "Failed to register user", error);
    res.status(500).json({ error: "Failed to register user" });
  }
}

export { register };

//login user controller
async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    log.info("auth:login", `Attempting login for: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signtoken(user.id);
    setTokenCookie(res, token);

    log.success("auth:login", `Login successful for: ${user.email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    log.error("auth:login", "Login failed", err);
    res.status(500).json({ error: "Login failed" });
  }
}

export { loginUser };

//logout user controller
async function logoutUser(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
}

export { logoutUser };

//get user

async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  res.json({ user });
}

export { me };

//oauth user controller

async function oauthUser(req: Request, res: Response): Promise<void> {
  try {
    const { provider, email, name, image } = req.body;

    // upsert: create on first OAuth login, skip if already exists
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // Keep name/image fresh from provider
        name: name ?? undefined,
        image: image ?? undefined,
      },
      create: {
        email,
        name,
        image,
        provider,
        role: "CUSTOMER",
        // No password — OAuth users authenticate via provider
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      },
    });

    const token = signtoken(user.id);

    // No cookie here — NextAuth manages its own session cookie
    // We just return our JWT so NextAuth can store it in its session
    res.json({ user, token });
  } catch (err) {
    log.error("auth:oauth", "OAuth sign-in failed", err);
    res.status(500).json({ error: "OAuth sign-in failed" });
  }
}
export { oauthUser };
