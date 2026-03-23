import { Router, Request, Response } from "express";
import { checkDelivery } from "../services/delivery.service";

// Explicit type annotation avoids TS2742 portability errors in enterprise builds
const router: ReturnType<typeof Router> = Router();

// GET /api/delivery/check?pincode=492001&total=999
router.get("/check", async (req: Request, res: Response): Promise<void> => {
  try {
    const { pincode, total } = req.query as { pincode: string; total?: string };

    if (!pincode) {
      res.status(400).json({ error: "pincode is required" });
      return;
    }

    const info = await checkDelivery(pincode, total ? Number(total) : 0);
    res.json({ data: info });
  } catch (err) {
    console.error("[delivery:check]", err);
    res.status(500).json({ error: "Failed to check delivery" });
  }
});

export default router;
