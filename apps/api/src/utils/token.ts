import jwt from "jsonwebtoken";
import { Response } from "express";

export function signtoken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIN: process.env.JWT_EXPIRES_IN || "10d",
  } as jwt.SignOptions);
}

export function setTokenCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}
