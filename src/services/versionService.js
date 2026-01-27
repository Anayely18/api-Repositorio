import applicationRepository from '../repositories/applicationRepository.js';
import documentRepository from '../repositories/documentRepository.js';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { mapApiStatusToDb } from '../utils/statusMapper.js';

class VersionService {
    async resubmitWithCorrections(applicationId, newDocuments, userId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Obtener la solicitud original
            const original = await applicationRepository.getDocumentsWithApplicationDetails(applicationId);

            if (!original) {
                throw new Error('Solicitud original no encontrada');
            }

            console.log('📋 Solicitud original:', {
                id: original.application_id,
                status: original.status
            });

            // 2. Validar que la solicitud esté observada
            if (original.status !== 'observado') {
                throw new Error('Solo se pueden reenviar solicitudes observadas');
            }

            // 3. Identificar documentos observados
            const observedDocs = original.documents.filter(
                d => d.status === 'observado'
            );

            if (observedDocs.length === 0) {
                throw new Error('No hay documentos observados para corregir');
            }

            console.log('📝 Documentos observados:', observedDocs.map(d => d.document_type));

            // 4. Validar que se hayan enviado todos los documentos observados
            const observedTypes = observedDocs.map(d => d.document_type);
            const submittedTypes = Object.keys(newDocuments);
            const missing = observedTypes.filter(t => !submittedTypes.includes(t));

            if (missing.length > 0) {
                throw new Error(`Faltan documentos observados: ${missing.join(', ')}`);
            }

            // 5. Actualizar documentos observados con los nuevos archivos
            for (const docType of observedTypes) {
                const file = newDocuments[docType];
                const oldDoc = observedDocs.find(d => d.document_type === docType);

                if (!file || !oldDoc) continue;

                console.log(`🔄 Actualizando documento: ${docType}`);

                // Actualizar el documento existente
                await connection.execute(
                    `UPDATE t_documentos 
                     SET 
                        nombre_archivo = ?,
                        ruta_archivo = ?,
                        tamano_kb = ?,
                        estado = 'pendiente',
                        razon_rechazo = NULL,
                        fecha_subida = NOW(),
                        updated_at = NOW()
                     WHERE id_documento = ?`,
                    [
                        file.originalname,
                        file.path,
                        Math.round(file.size / 1024),
                        oldDoc.document_id
                    ]
                );
            }

            // 6. Actualizar estado general de la solicitud a "en_revision"
            await connection.execute(
                `UPDATE t_solicitudes 
                 SET estado = 'en_revision', updated_at = NOW()
                 WHERE id_solicitud = ?`,
                [applicationId]
            );

            // 7. Registrar en historial
            const historyId = uuidv4();
            await connection.execute(
                `INSERT INTO t_historial_solicitudes 
                 (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, comentario, id_admin, fecha_cambio)
                 VALUES (?, ?, NULL, 'observado', 'en_revision', 'Documentos corregidos y reenviados', ?, NOW())`,
                [historyId, applicationId, userId]
            );

            await connection.commit();

            console.log('✅ Reenvío exitoso');

            return {
                success: true,
                version: 2, // Por ahora hardcodeado, puedes implementar versionado real más tarde
                applicationId,
                updatedDocuments: observedTypes
            };

        } catch (error) {
            await connection.rollback();
            console.error('❌ Error en resubmitWithCorrections:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default new VersionService();