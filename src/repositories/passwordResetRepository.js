import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid'
class PasswordResetRepository {

    async saveVerificationCode(email, code, expiresAt) {

        await this.deleteByEmail(email);
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const query = `
            INSERT INTO t_codigo_verificacion (id_codigo_verificacion, email, codigo, expira_en, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [id, email, code, expiresAt, createdAt, updatedAt]);
        return result.insertId;
    }

    async findValidCode(email, code) {
        const query = `
            SELECT *, 
                   expira_en,
                   NOW() as hora_actual,
                   CASE 
                       WHEN expira_en > NOW() THEN 'VALIDO'
                       ELSE 'EXPIRADO'
                   END as estado
            FROM t_codigo_verificacion
            WHERE email = ? AND codigo = ? AND usado = FALSE
        `;

        const [rows] = await pool.execute(query, [email, code]);

        if (rows.length === 0) {
            return null;
        }

        const record = rows[0];
        const now = new Date();
        const expiresAt = new Date(record.expira_en);

        

        if (expiresAt <= now) {
            return null; 
        }

        return record;
        
        
    }

    async markAsUsed(id) {
        const query = 'UPDATE t_codigo_verificacion SET usado = TRUE WHERE id_codigo_verificacion = ?';
        await pool.execute(query, [id]);
    }

    async deleteByEmail(email) {
        const query = 'DELETE FROM t_codigo_verificacion WHERE email = ?';
        await pool.execute(query, [email]);
    }

    async cleanExpiredCodes() {
        const query = 'DELETE FROM t_codigo_verificacion WHERE expira_en < NOW()';
        const [result] = await pool.execute(query);
        return result.affectedRows;
    }

    async updatePassword(email, hashedPassword) {
        const query = 'UPDATE t_administradores SET contrasena = ? WHERE email = ?';
        const [result] = await pool.execute(query, [hashedPassword, email]);
        return result.affectedRows > 0;
    }
}

export default new PasswordResetRepository();
