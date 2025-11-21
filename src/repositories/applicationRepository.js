import pool from "../config/database.js";

class ApplicationRepository {
    async create(id, applicationType, name, surname, dni, contactNumber, professionalSchool, acceptTerms, ajustedFormat, errorsRead, informedProcedure, projectName, observations, linkToPublishedTesis, status, applicationDate, createdAt, updatedAt) {
        const query = 'INSERT INTO t_solicitudes (id_solicitud, tipo_solicitud, nombres, apellidos, dni, numero_contacto, escuela_profesional, acepta_terminos, formato_ajustado, errores_leidos, tramite_informado, nombre_proyecto, observaciones, link_tesis_publicada, estado, fecha_solicitud, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [id, applicationType, name, surname, dni, contactNumber, professionalSchool, acceptTerms, ajustedFormat, errorsRead, informedProcedure, projectName, observations, linkToPublishedTesis, status, applicationDate, createdAt, updatedAt]);
        return result.insertId;
    }
}

export default new ApplicationRepository();
