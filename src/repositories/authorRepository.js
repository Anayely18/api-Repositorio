import pool from "../config/database.js";

class AuthorRepository {
    async create(id, idApplication, authorOrder, name, surname, dni, urlOrcid, professionalSchool, createdAt, updatedAt) {
        const query = `INSERT INTO t_autores 
            (id_autor, id_solicitud, orden_autor, nombres, apellidos, dni, url_orcid, escuela_profesional, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [
            id, idApplication, authorOrder, name, surname, dni, urlOrcid, professionalSchool, createdAt, updatedAt
        ]);
        return result.insertId;
    }
}

export default new AuthorRepository();
