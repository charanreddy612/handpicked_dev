import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
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

app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true }));

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
    methods: ["GET", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // set to false if you don’t use cookies/credentials
  })
);
app.options("/api/auth/login", cors());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

// 404 (after routes)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler (last)
app.use((err, req, res, next) => {
  // Avoid leaking stack to client in prod
  const status = err.status || 500;
  const message = status === 500 ? "Internal Server Error" : err.message;
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
