// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profileRoutes';
// import other routes later

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paye Backend Running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});