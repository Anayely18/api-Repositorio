import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tramiteRoutes from './routes/tramiteRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('src/uploads'));
app.use('/api/tramites', tramiteRoutes);
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en http://localhost:${PORT}`));
