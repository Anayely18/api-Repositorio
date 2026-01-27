import pool from '../config/database.js';
import Administrator from '../models/Administrator.js';

class AdministratorRepository {

    async create(id, username, hashedPassword, email, name, surname, dni, last_access, active, createdAt, updatedAt) {
        const query = 'INSERT INTO t_administradores (id_admin, nombre_usuario, contrasena, email, nombre, apellidos, dni, ultimo_acceso, activo, created_at, updated_at ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [id, username, hashedPassword, email, name, surname, dni, last_access, active, createdAt, updatedAt]);
        return result.insertId;
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM t_administradores WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async findByDni(dni) {
        const query = 'SELECT * FROM t_administradores WHERE dni = ?';
        const [rows] = await pool.execute(query, [dni]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async findById(id) {
        const query = 'SELECT * FROM t_administradores WHERE id_admin = ?';
        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async emailExists(email) {
        const query = 'SELECT COUNT(*) as count FROM t_administradores WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0].count > 0;
    }

    async dniExists(dni) {
        const query = 'SELECT COUNT(*) as count FROM t_administradores WHERE dni = ?';
        const [rows] = await pool.execute(query, [dni]);
        return rows[0].count > 0;
    }

    async update(id, username, hashedPassword, email, name, surname, updatedAt) {
        const query = `
        UPDATE t_administradores 
        SET nombre_usuario = ?, 
            contrasena = ?, 
            email = ?, 
            nombre = ?, 
            apellidos = ?, 
            updated_at = ?
        WHERE id_admin = ?
    `;
        const [result] = await pool.execute(query, [
            username,
            hashedPassword,
            email,
            name,
            surname,
            updatedAt,
            id
        ]);
        return result.affectedRows > 0;
    }

    async updateLastAccess(id, lastAccess) {
        const query = 'UPDATE t_administradores SET ultimo_acceso = ? WHERE id_admin = ?';
        const [result] = await pool.execute(query, [lastAccess, id]);
        return result.affectedRows > 0;
    }
}

export default new AdministratorRepository();
