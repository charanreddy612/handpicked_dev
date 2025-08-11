import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import merchantRoutes from './routes/merchantsRoutes.js';
import couponRoutes from './routes/couponsRoutes.js';
import bannerRoutes from './routes/bannersRoutes.js';
import tagRoutes from './routes/tagsRoutes.js';
import sidebarRoutes from './routes/sidebarRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/sidebar', sidebarRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Handpicked Backend API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});