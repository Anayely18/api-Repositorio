import pool from "../config/database.js";

class ApplicationRepository {
    async create(
        id,
        applicationType,
        name,
        surname,
        email,
        dni,
        contactNumber,
        professionalSchool,
        acceptTerms,
        ajustedFormat,
        errorsRead,
        informedProcedure,
        declaresTruth,
        financingType,
        projectName,
        observations,
        linkToPublishedTesis,
        status,
        applicationDate,
        createdAt,
        updatedAt
    ) {
        const query = `
            INSERT INTO t_solicitudes (
                id_solicitud,
                tipo_solicitud,
                nombres,
                apellidos,
                email,
                dni,
                numero_contacto,
                escuela_profesional,
                acepta_terminos,
                formato_ajustado,
                errores_leidos,
                tramite_informado,
                declara_verdad,
                tipo_financiamiento,
                nombre_proyecto,
                observaciones,
                link_tesis_publicada,
                estado,
                fecha_solicitud,
                created_at,
                updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const [result] = await pool.execute(query, [
            id,
            applicationType,
            name,
            surname,
            email,
            dni,
            contactNumber,
            professionalSchool,
            acceptTerms,
            ajustedFormat,
            errorsRead,
            informedProcedure,
            declaresTruth,
            financingType,
            projectName,
            observations,
            linkToPublishedTesis,
            status,
            applicationDate,
            createdAt,
            updatedAt
        ]);

        return result.insertId;
    }

    async getDocumentsWithApplicationDetails() {
        const query = `
            SELECT 
                CONCAT(s.nombres, ' ', s.apellidos) AS nombre_archivo,
                d.fecha_subida,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones
            FROM t_documentos d
            INNER JOIN t_solicitudes s ON d.id_solicitud = s.id_solicitud
            ORDER BY d.fecha_subida DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }
}

export default new ApplicationRepository();
