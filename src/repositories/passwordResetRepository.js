import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid'
class PasswordResetRepository {

    async saveVerificationCode(email, code, expiresAt) {
        // ✅ Limpia el email de espacios y convierte a minúsculas
        const cleanEmail = email.trim().toLowerCase();
        const codeStr = String(code).trim();

        console.log('💾 Guardando código:');
        console.log('   Email original:', `"${email}"`);
        console.log('   Email limpio:', `"${cleanEmail}"`);
        console.log('   Código:', codeStr);

        await this.deleteByEmail(cleanEmail);

        const id = uuidv4();
        const now = new Date();
        const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace("T", " ");
        const nowFormatted = now.toISOString().slice(0, 19).replace("T", " ");

        const query = `
        INSERT INTO t_codigo_verificacion (id_codigo_verificacion, email, codigo, expira_en, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

        const [result] = await pool.execute(query, [id, cleanEmail, codeStr, expiresAtFormatted, nowFormatted, nowFormatted]);
        return result.insertId;
    }

    async findValidCode(email, code) {
        const cleanEmail = email.trim().toLowerCase();
        const codeStr = String(code).trim();

        console.log('🔍 Buscando código:');
        console.log('   Email:', `"${cleanEmail}"`);
        console.log('   Código:', `"${codeStr}"`);

        const query = `
        SELECT 
            id_codigo_verificacion,
            email,
            codigo,
            expira_en,
            usado,
            NOW() as hora_actual,
            TIMESTAMPDIFF(SECOND, NOW(), expira_en) as segundos_restantes
        FROM t_codigo_verificacion
        WHERE TRIM(LOWER(email)) = ? 
          AND TRIM(codigo) = ? 
          AND (usado = FALSE OR usado IS NULL)
    `;

        const [rows] = await pool.execute(query, [cleanEmail, codeStr]);

        console.log('   Resultados encontrados:', rows.length);

        if (rows.length === 0) {
            return null;
        }

        const record = rows[0];
        const now = new Date();
        const expiresAt = new Date(record.expira_en);

        console.log('⏰ Validando expiración:');
        console.log('   Ahora:', now.toISOString());
        console.log('   Expira:', expiresAt.toISOString());
        console.log('   Segundos restantes:', record.segundos_restantes);

        if (expiresAt <= now) {
            console.log('❌ Código expirado');
            return null;
        }

        console.log('✅ Código válido encontrado');
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
