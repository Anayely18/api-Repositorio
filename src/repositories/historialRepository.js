import pool from "../config/database.js";

class HistorialRepository {
    async getHistoryWithDocumentPaths(applicationId) {
        const [rows] = await pool.execute(`
            SELECT 
                h.*,
                h.file_path_historico,
                d.tipo_documento AS document_type,
                d.nombre_archivo AS current_file_name
            FROM t_historial_solicitudes h
            LEFT JOIN t_documentos d ON h.id_documento = d.id_documento
            WHERE h.id_solicitud = ?
            ORDER BY h.fecha_cambio DESC
        `, [applicationId]);

        return rows;
    }
}

export default new HistorialRepository();