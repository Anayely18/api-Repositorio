import bcrypt from 'bcryptjs';
import emailService from './emailService.js';
import passwordResetRepository from '../repositories/passwordResetRepository.js';
import administratorRepository from '../repositories/administratorRepository.js';

class PasswordResetService {
    
    async requestVerificationCode(email) {
        const administrator = await administratorRepository.findByEmail(email);
        if (!administrator) {
            throw new Error('No existe una cuenta asociada a este correo electrónico');
        }

        const code = emailService.generateVerificationCode();
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await passwordResetRepository.saveVerificationCode(email, code, expiresAt);

        await emailService.sendVerificationCode(email, code, administrator.name);

        return {
            message: 'Código de verificación enviado a tu correo',
            expiresIn: 10 
        };
    }

    async verifyCode(email, code) {
        const verificationRecord = await passwordResetRepository.findValidCode(email, code);
        
        if (!verificationRecord) {
            throw new Error('Código inválido o expirado');
        }

        return {
            valid: true,
            message: 'Código verificado correctamente'
        };
    }

    async resetPassword(email, code, newPassword) {
        const verificationRecord = await passwordResetRepository.findValidCode(email, code);
        
        if (!verificationRecord) {
            throw new Error('Código inválido o expirado');
        }

        if (!newPassword || newPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        const administrator = await administratorRepository.findByEmail(email);
        if (!administrator) {
            throw new Error('Usuario no encontrado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await passwordResetRepository.updatePassword(email, hashedPassword);
        
        if (!updated) {
            throw new Error('No se pudo actualizar la contraseña');
        }
        console.log(verificationRecord)
        await passwordResetRepository.markAsUsed(verificationRecord.id_codigo_verificacion);

        await emailService.sendPasswordChangeConfirmation(email, administrator.name);

        return {
            message: 'Contraseña actualizada exitosamente'
        };
    }

    async cleanExpiredCodes() {
        const deletedCount = await passwordResetRepository.cleanExpiredCodes();
        return {
            message: `${deletedCount} códigos expirados eliminados`
        };
    }
}

export default new PasswordResetService();
