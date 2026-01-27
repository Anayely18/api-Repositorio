import pool from "../config/database.js";

export class AdvisorRepository {
    async create(id, idApplication, advisoryOrder, fullName, dni, orcid, createdAt, updatedAt) {
        const query = 'INSERT INTO t_asesores (id_asesor, id_solicitud, orden_asesor, apellidos_nombres, dni, orcid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [id, idApplication, advisoryOrder, fullName, dni, orcid, createdAt, updatedAt]);
        return result.insertId;
    }
}

export default new AdvisorRepository();
