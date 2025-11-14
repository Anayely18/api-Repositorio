import pool from '../config/database.js';

class PasswordResetRepository {

    async saveVerificationCode(email, code, expiresAt) {

        await this.deleteByEmail(email);

        const query = `
            INSERT INTO codigo_verificacion (correo, codigo, expira_en) 
            VALUES (?, ?, ?)
        `;

        const [result] = await pool.execute(query, [email, code, expiresAt]);
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
            FROM codigo_verificacion 
            WHERE correo = ? AND codigo = ? AND usado = FALSE
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
        const query = 'UPDATE codigo_verificacion SET usado = TRUE WHERE id = ?';
        await pool.execute(query, [id]);
    }

    async deleteByEmail(email) {
        const query = 'DELETE FROM codigo_verificacion WHERE correo = ?';
        await pool.execute(query, [email]);
    }

    async cleanExpiredCodes() {
        const query = 'DELETE FROM codigo_verificacion WHERE expira_en < NOW()';
        const [result] = await pool.execute(query);
        return result.affectedRows;
    }

    async updatePassword(email, hashedPassword) {
        const query = 'UPDATE Administrador SET contrasena = ? WHERE correo = ?';
        const [result] = await pool.execute(query, [hashedPassword, email]);
        return result.affectedRows > 0;
    }
}

export default new PasswordResetRepository();