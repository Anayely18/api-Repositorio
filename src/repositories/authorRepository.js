import pool from "../config/database.js";

class AuthorRepository {
    /**
     * Crea un autor / coautor / colaborador en t_autores
     */
    async create(
        id,
        idApplication,
        authorOrder,
        name,
        surname,
        dni,
        urlOrcid,
        professionalSchool,
        tipoColaborador,
        tipoUbicacion,
        tipoRol,
        createdAt,
        updatedAt
    ) {
        const query = `
            INSERT INTO t_autores (
                id_autor,
                id_solicitud,
                orden_autor,
                tipo_colaborador,
                tipo_ubicacion,
                tipo_rol,
                nombres,
                apellidos,
                dni,
                url_orcid,
                escuela_profesional,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            id,
            idApplication,
            authorOrder,
            tipoColaborador,
            tipoUbicacion,
            tipoRol,
            name,
            surname,
            dni,
            urlOrcid,
            professionalSchool,
            createdAt,
            updatedAt
        ]);

        return result.insertId;
    }
}

export default new AuthorRepository();
