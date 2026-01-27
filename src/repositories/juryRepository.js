import pool from "../config/database.js";

class JuryRepository { 
    async create(id, idApplication, juryRole, fullName, createdAt, updatedAt) {
        const query = 'INSERT INTO t_jurados (id_jurado, id_solicitud, rol_jurado, apellidos_nombres, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [id, idApplication, juryRole, fullName, createdAt, updatedAt]);
        return result.insertId;
    }
}

export default new JuryRepository();
