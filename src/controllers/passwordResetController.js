import passwordResetService from '../services/passwordResetService.js';

class PasswordResetController {

    async requestCode(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico es obligatorio'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de correo electrónico no válido'
                });
            }

            const result = await passwordResetService.requestVerificationCode(email);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    expiresIn: result.expiresIn
                }
            });
        } catch (error) {
            console.error('Error al solicitar código:', error);

            if (error.message === 'No existe una cuenta asociada a este correo electrónico') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al enviar el código de verificación'
            });
        }
    }

    async verifyCode(req, res) {
        try {
            const { email, code } = req.body;
            console.log("Backend recibió:", { email, code });
            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo y código son obligatorios'
                });
            }

            const result = await passwordResetService.verifyCode(email, code);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error al verificar código:', error);

            if (error.message === 'Código inválido o expirado') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al verificar el código'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { email, code, newPassword } = req.body;

            if (!email || !code || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const result = await passwordResetService.resetPassword(email, code, newPassword);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);

            if (error.message === 'Código inválido o expirado') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al restablecer la contraseña'
            });
        }
    }
}

export default new PasswordResetController();