import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tramiteRoutes from './routes/tramiteRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('src/uploads')); // servir PDFs
app.use('/api/tramites', tramiteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en http://localhost:${PORT}`));
