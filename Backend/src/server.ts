import express from 'express';
// @ts-ignore
import cors from 'cors';
import dotenv from 'dotenv';
import queueRoutes from './routes/queueRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', queueRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`); 
});