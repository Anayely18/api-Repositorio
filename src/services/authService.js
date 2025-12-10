import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import administratorRepository from '../repositories/administratorRepository.js'
import { v4 as uuidv4 } from 'uuid'

class AuthService {
    async register(password, email, name, surname, dni) {
        const emailExists = await administratorRepository.emailExists(email);
        const dniExists = await administratorRepository.dniExists(dni);
        if (dniExists) {
            throw new Error('Este dni ya esta registrado.')
        }
        if (emailExists) {
            throw new Error('Este correo ya esta registrado.');
        }
        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = name + dni;
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;
        const last_access = now;
        const active = 1;
        console.log('Creating administrator with ID:', id);
        const adminId = await administratorRepository.create(id, username, hashedPassword, email, name, surname, dni, last_access, active, createdAt, updatedAt);

        const administrator = await administratorRepository.findById(adminId);
        console.log('Administrator created:', administrator);
        const token = this.generateToken(administrator);

        return {
            administrator: administrator.toJSON(),
            token
        };
    }

    async login(email, password) {

        const administrator = await administratorRepository.findByEmail(email);
        if (!administrator) {
            throw new Error('Credenciales no válidas');
        }

        const isValidPassword = await bcrypt.compare(password, administrator.password);
        if (!isValidPassword) {
            throw new Error('Credenciales no válidas');
        }
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        await administratorRepository.updateLastAccess(administrator.id, now);
        const token = this.generateToken(administrator);

        return {
            administrator: administrator.toJSON(),
            token
        };
    }

    async getProfile(adminId) {
        const administrator = await administratorRepository.findById(adminId);
        if (!administrator) {
            throw new Error('Administrador no encontrado');
        }
        console.log(administrator)
        return {
            id_admin: administrator.id,
            nombre: administrator.name,
            apellidos: administrator.surname,
            nombre_usuario: administrator.username,
            email: administrator.email,
            dni: administrator.dni,
            activo: administrator.active === 1,
            created_at: administrator.createdAt,
            updated_at: administrator.updatedAt,
            ultimo_acceso: administrator.lastAccess
        };
    }

    async updateProfile(adminId, updateData) {
        const administrator = await administratorRepository.findById(adminId);
        if (!administrator) {
            throw new Error('Administrador no encontrado');
        }

        const { nombre, apellidos, email, nombre_usuario, currentPassword, newPassword } = updateData;

        // Validaciones
        if (!nombre || !nombre.trim()) {
            throw new Error('El nombre es obligatorio');
        }

        if (!apellidos || !apellidos.trim()) {
            throw new Error('Los apellidos son obligatorios');
        }

        if (!email || !email.includes('@')) {
            throw new Error('Ingresa un correo electrónico válido');
        }

        // Verificar si el email ya existe (excepto el actual)
        if (email !== administrator.email) {
            const emailExists = await administratorRepository.emailExists(email);
            if (emailExists) {
                throw new Error('Este correo ya está registrado');
            }
        }

        // Si está cambiando la contraseña
        let hashedPassword = administrator.password;
        if (newPassword) {
            if (!currentPassword) {
                throw new Error('Debes ingresar tu contraseña actual');
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(currentPassword, administrator.password);
            if (!isValidPassword) {
                throw new Error('La contraseña actual es incorrecta');
            }

            if (newPassword.length < 8) {
                throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
            }

            hashedPassword = await bcrypt.hash(newPassword, 10);
        }

        // Actualizar datos
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        await administratorRepository.update(
            adminId,
            nombre_usuario || administrator.username,
            hashedPassword,
            email,
            nombre,
            apellidos,
            now
        );

        // Obtener datos actualizados
        const updatedAdmin = await administratorRepository.findById(adminId);

        return {
            id_admin: updatedAdmin.id,
            nombre: updatedAdmin.name,
            apellidos: updatedAdmin.surname,
            nombre_usuario: updatedAdmin.username,
            email: updatedAdmin.email,
            dni: updatedAdmin.dni,
            activo: updatedAdmin.active === 1,
            created_at: updatedAdmin.createdAt,
            updated_at: updatedAdmin.updatedAt,
            ultimo_acceso: updatedAdmin.lastAccess
        };
    }


    generateToken(administrator) {
        console.log(administrator)
        const payload = {
            id: administrator.id,
            email: administrator.email
        };

        return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            throw new Error('Token no válido');
        }
    }
}

export default new AuthService();
