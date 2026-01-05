import authService from '../services/authService.js';

class AuthController {
    async register(req, res) {
        try {
            const { name, surname, dni, email, password } = req.body;

            if (!email || !password || !name || !dni || !surname) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            const dniRegex = /^\d{8}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!dniRegex.test(dni)) {
                return res.status(400).json({
                    success: false,
                    message: 'El DNI debe tener 8 dígitos numéricos'
                });
            }

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de correo electrónico no válido'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const result = await authService.register(password, email, name, surname, dni);

            res.status(201).json({
                success: true,
                message: 'Administrador registrado exitosamente',
                data: {
                    token: result.token,
                    user: result.administrator,
                },
            });
        } catch (error) {
            if (error.message === 'Este correo ya esta registrado.') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message === 'Este dni ya esta registrado.') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Error de registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere correo electrónico y contraseña'
                });
            }

            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    token: result.token,
                    user: result.administrator,
                },
            });
        } catch (error) {
            if (error.message === 'Credenciales no válidas') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async getProfile(req, res) {
        try {
            res.status(200).json({
                success: true,
                data: req.user
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

export default new AuthController();
