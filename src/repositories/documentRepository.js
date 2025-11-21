import pool from "../config/database.js";

class DocumentRepository {
    async create(id, idApplication, documentType, archiveName, archiveRoute, sizeKB, uploadDate, createdAt, updatedAt) {
        const query = 'INSERT INTO t_documentos (id_documento, id_solicitud, tipo_documento, nombre_archivo, ruta_archivo, tamano_kb, fecha_subida, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [id, idApplication, documentType, archiveName, archiveRoute, sizeKB, uploadDate, createdAt, updatedAt]);
        return result.insertId;
    }
 }

export default new DocumentRepository();
