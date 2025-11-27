import pool from "../config/database.js";

class ApplicationRepository {

    /* ============================================================
       INSERTAR SOLICITUD
    ============================================================ */
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

        await pool.execute(query, [
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

        return id;
    }

    /* ============================================================
       OBTENER LISTA DE ESTUDIANTES (CRUD)
    ============================================================ */
    async getStudents() {
        const query = `
            SELECT
                s.id_solicitud,
                s.nombre_proyecto AS nombre_archivo,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones,
                s.fecha_solicitud AS fecha_subida
            FROM t_solicitudes s
            WHERE s.tipo_solicitud = 'estudiante'
            ORDER BY s.fecha_solicitud DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    /* ============================================================
       OBTENER LISTA DE DOCENTES (CRUD)
    ============================================================ */
    async getTeachers() {
        const query = `
            SELECT
                s.id_solicitud,
                s.nombre_proyecto,
                s.nombres,
                s.apellidos,
                s.dni,
                s.escuela_profesional AS escuela,
                s.fecha_solicitud AS fecha_subida,
                s.observaciones
            FROM t_solicitudes s
            WHERE s.tipo_solicitud = 'docente'
            ORDER BY s.fecha_solicitud DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

}

export default new ApplicationRepository();
