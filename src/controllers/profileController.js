import authService from '../services/authService.js';

class ProfileController {
    async getProfile(req, res) {
        try {
            const adminId = req.user.id;
            
            const profile = await authService.getProfile(adminId);
            
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error getting profile:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el perfil'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const adminId = req.user.id;
            const updateData = req.body;
            
            const updatedProfile = await authService.updateProfile(adminId, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: updatedProfile
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            
            // Manejar errores específicos
            if (error.message.includes('obligatorio') || 
                error.message.includes('válido') ||
                error.message.includes('registrado') ||
                error.message.includes('contraseña')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el perfil'
            });
        }
    }
}

export default new ProfileController();
