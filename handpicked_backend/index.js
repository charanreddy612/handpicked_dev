import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";

import { etagMiddleware } from "./middleware/etagMiddleware.js";
import { publicRateLimiter } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/logger.js";

import publicRouter from "./routes/public.js";
import authRoutes from "./routes/authRoutes.js";
import couponRoutes from "./routes/couponsRoutes.js";
import bannerRoutes from "./routes/bannersRoutes.js";
import tagsRoutes from "./routes/tagsRoutes.js";
import sidebarRoutes from "./routes/sidebarRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import blogCategoryRoutes from "./routes/blogCategoryRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import merchantCategoryRoutes from "./routes/merchantCategoryRoutes.js";
import importRoutes from "./routes/importRoutes.js";

dotenv.config();
const app = express();

// If behind a proxy/CDN, enable correct IP/proto handling
// app.set("trust proxy", 1);

// CORS
const allowedOrigins = [
  "https://handpickedstartup.vercel.app",
  "https://handpickedclient.vercel.app",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true }));

//Logging
app.use(requestLogger);
if (process.env.NODE_ENV !== "test") app.use(requestLogger);

// Public: ETag + rate limit + router
app.use(etagMiddleware);
app.use("/public", publicRateLimiter);
app.use(publicRouter);

// Static
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//Helmet Headers for API routes
app.use(
  "/api",
  helmet({
    contentSecurityPolicy: false, // can tune later
    crossOriginEmbedderPolicy: false,
  })
);
// Admin/API routes (deduped)
app.use("/api/auth", authRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/sidebar", sidebarRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/merchant-categories", merchantCategoryRoutes);
app.use("/api/imports", importRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Handpicked Backend API" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
