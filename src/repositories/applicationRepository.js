// src/repositories/applicationRepository.js
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

    async getStudents() {
        const query = `
            SELECT 
                s.id_solicitud,
                s.fecha_solicitud AS fecha_subida,
                s.nombres,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones,
                COALESCE(
                    GROUP_CONCAT(DISTINCT CONCAT(a.nombres, ' ', a.apellidos) SEPARATOR ' | '),
                    CONCAT(s.nombres, ' ', s.apellidos)
                ) AS autores_busqueda
            FROM t_solicitudes s
            LEFT JOIN t_autores a ON a.id_solicitud = s.id_solicitud
            WHERE s.tipo_solicitud = 'estudiante'
            GROUP BY 
                s.id_solicitud,
                s.fecha_solicitud,
                s.nombres,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones
            ORDER BY s.fecha_solicitud DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    /** 🟢 LISTA SOLO DOCENTES, 1 FILA POR SOLICITUD
     *   - nombres / apellidos = primer autor (campo de t_solicitudes)
     *   - autores_busqueda = todos los autores/coautores para el buscador
     */
    async getTeachers() {
        const query = `
            SELECT 
                s.id_solicitud,
                s.fecha_solicitud AS fecha_subida,
                s.nombres,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones,
                COALESCE(
                    GROUP_CONCAT(DISTINCT CONCAT(a.nombres, ' ', a.apellidos) SEPARATOR ' | '),
                    CONCAT(s.nombres, ' ', s.apellidos)
                ) AS autores_busqueda
            FROM t_solicitudes s
            LEFT JOIN t_autores a ON a.id_solicitud = s.id_solicitud
            WHERE s.tipo_solicitud = 'docente'
            GROUP BY 
                s.id_solicitud,
                s.fecha_solicitud,
                s.nombres,
                s.apellidos,
                s.dni,
                s.escuela_profesional,
                s.observaciones
            ORDER BY s.fecha_solicitud DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

}

export default new ApplicationRepository();
