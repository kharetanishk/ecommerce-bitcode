import dotenv from "dotenv";
dotenv.config();
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import categoryRouter from "./routes/categories";
import attributeRouter from "./routes/attributes";
import uploadRoutes from "./routes/upload";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import reviewRoutes from "./routes/reviews";
import inventoryRoutes from "./routes/inventory";
import deliveryRoutes from "./routes/delivery";
import returnRoutes from "./routes/returns";

const app: Express = express();
const PORT = process.env.PORT ?? 4000;

// ─── Core middleware ───────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true, // required for cookies
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products/:productId/reviews", reviewRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/categories/:categoryId/attributes", attributeRouter);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/returns", returnRoutes);

// Shiprocket webhook — no auth, Shiprocket calls this
app.use(
  "/api/orders/webhook/shiprocket",
  express.raw({ type: "application/json" }),
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[unhandled error]", err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});

export default app;
