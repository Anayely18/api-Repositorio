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

        const token = this.generateToken(administrator);

        return {
            administrator: administrator.toJSON(),
            token
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
