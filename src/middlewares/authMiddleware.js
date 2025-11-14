import authService from '../services/authService.js';
import administratorRepository from '../repositories/administratorRepository.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó ningún token'
            });
        }

        const token = authHeader.substring(7);

        const decoded = authService.verifyToken(token);

        const administrator = await administratorRepository.findById(decoded.id);

        if (!administrator) {
            return res.status(401).json({
                success: false,
                message: 'Token no válido'
            });
        }

        req.user = administrator.toJSON();
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token no válido o caducado'
        });
    }
};

export default authMiddleware;