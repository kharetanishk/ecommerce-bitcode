import { Router, Response } from "express";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { generateUploadUrl } from "../lib/r2";
import { z } from "zod";

const router = Router();

const uploadSchema = z.object({
  contentType: z.string(),
  folder: z.enum(["products", "avatars"]).default("products"),
});

// POST /api/upload/presign
// Admin requests a presigned URL → browser uploads directly to R2
// Server never touches the file bytes → stays fast and stateless
router.post(
  "/presign",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "contentType is required" });
        return;
      }

      const { uploadUrl, key, publicUrl } = await generateUploadUrl(
        parsed.data.contentType,
        parsed.data.folder,
      );

      res.json({ uploadUrl, key, publicUrl });
    } catch (err: any) {
      console.error("[upload:presign]", err);
      res
        .status(400)
        .json({ error: err.message ?? "Failed to generate upload URL" });
    }
  },
);

export default router;
