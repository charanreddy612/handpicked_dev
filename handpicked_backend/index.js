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
import blogRoutes from './routes/blogRoutes.js';

dotenv.config();
const app = express();

// ✅ CORS config – must be before any routes/middleware that need it
const allowedOrigins = [
  'https://handpickedstartup.vercel.app',
  'http://localhost4321:' // optional for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true // required for withCredentials: true
}));

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
app.use('/api/blogs', blogRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Handpicked Backend API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
