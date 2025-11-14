import pool from '../config/database.js';
import Administrator from '../models/Administrator.js';

class AdministratorRepository {
    async create(name, surname, dni, email, hashedPassword) {
        const query = 'INSERT INTO Administrador (nombre, apellidos, dni, correo, contrasena) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [name, surname, dni, email, hashedPassword]);
        return result.insertId;
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM Administrador WHERE correo = ?';
        const [rows] = await pool.execute(query, [email]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async findByDni(dni) {
        const query = 'SELECT * FROM Administrador WHERE dni = ?';
        const [rows] = await pool.execute(query, [dni]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async findById(id) {
        const query = 'SELECT * FROM Administrador WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        return new Administrator(rows[0]);
    }

    async emailExists(email) {
        const query = 'SELECT COUNT(*) as count FROM Administrador WHERE correo = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0].count > 0;
    }

    async dniExists(dni) {
        const query = 'SELECT COUNT(*) as count FROM Administrador WHERE dni = ?';
        const [rows] = await pool.execute(query, [dni]);
        return rows[0].count > 0;
    }
}

export default new AdministratorRepository();