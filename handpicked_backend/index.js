import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from "path";

import authRoutes from './routes/authRoutes.js';
import merchantRoutes from './routes/merchantsRoutes.js';
import couponRoutes from './routes/couponsRoutes.js';
import bannerRoutes from './routes/bannersRoutes.js';
import tagsRoutes from './routes/tagsRoutes.js';
import sidebarRoutes from './routes/sidebarRoutes.js';

const allowedOrigins = [
  "https://handpickedstartup.vercel.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, cb) => {
    // allow same-origin/non-browser tools (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

dotenv.config();
const app = express();

app.use(cors());
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/sidebar', sidebarRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Handpicked Backend API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});