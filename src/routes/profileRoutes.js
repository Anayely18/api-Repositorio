import express from 'express';
import profileController from '../controllers/profileController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/profile - Obtener perfil del administrador
router.get('/', profileController.getProfile);

// PUT /api/profile - Actualizar perfil del administrador
router.put('/', profileController.updateProfile);

export default router;
