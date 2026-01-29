import { v4 as uuidv4 } from "uuid";
import applicationRepository from "../repositories/applicationRepository.js";

class ApplicationService {

    async createApplication(data) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        let email = data.email;
        if (!email || email.trim() === "") {
            email = `no-email-${data.dni || id}@noemail.local`;
        }

        await applicationRepository.create(
            id,
            data.applicationType,
            data.name,
            data.surname,
            email,
            data.dni,
            data.contactNumber,
            data.professionalSchool,
            data.acceptTerms,
            data.ajustedFormat,
            data.errorsRead,
            data.informedProcedure,
            data.declaresTruth,
            data.financingType,
            data.projectName,
            data.observations,
            data.linkToPublishedTesis,
            data.status,
            data.applicationDate,
            now,
            now
        );

        return { application: { id } };
    }

    async getApplications(options) {
        return await applicationRepository.getApplications(options);
    }

    async getDocumentsWithApplicationDetails(id) {
        return await applicationRepository.getDocumentsWithApplicationDetails(id);
    }

    async getApplicationByDni(dni, applicationType) {
        try {
            if (applicationType === 'estudiante' && dni.length !== 8) {
                throw new Error('DNI de estudiante debe tener 8 dígitos');
            }
            if (applicationType === 'docente' && dni.length !== 8) {
                throw new Error('DNI de docente debe tener 8 dígitos');
            }

            const application = await applicationRepository.getApplicationByDni(dni, applicationType);

            if (!application) {
                return null;
            }

            return application;
        } catch (error) {
            console.error('Error en getApplicationByDni service:', error);
            throw error;
        }
    }

    // En applicationService.js

    async updateDocumentReview(documentId, status, rejectionReason, images) {
        try {
            const result = await applicationRepository.updateDocumentStatus(
                documentId,
                status,
                rejectionReason,
                images
            );
            return result;
        } catch (error) {
            console.error('Error al actualizar documento:', error);
            throw error;
        }
    }

    async updateApplicationReview(applicationId, newStatus, observations, adminId) {
        try {
            const result = await applicationRepository.updateApplicationStatus(
                applicationId,
                newStatus,
                observations,
                adminId
            );
            return result;
        } catch (error) {
            console.error('Error al actualizar solicitud:', error);
            throw error;
        }
    }

    async bulkUpdateDocuments(applicationId, documentUpdates) {
        try {
            const result = await applicationRepository.bulkUpdateDocuments(
                applicationId,
                documentUpdates
            );
            return result;
        } catch (error) {
            console.error('Error al actualizar documentos:', error);
            throw error;
        }
    }


    async savePublicationLink(applicationId, publicationLink) {
        try {
            const result = await applicationRepository.savePublicationLink(applicationId, publicationLink);
            return result;
        } catch (error) {
            console.error('Error en savePublicationLink (service):', error);
            throw error;
        }
    }

    async resubmitWithCorrections(applicationId, newDocuments, userId) {
        try {
            const app = await applicationRepository.getDocumentsWithApplicationDetails(applicationId);

            if (!app) {
                throw new Error('Solicitud no encontrada');
            }

            if (app.status !== 'observado') {
                throw new Error('Solo se pueden reenviar solicitudes observadas');
            }

            const observedDocs = app.documents.filter(d => d.status === 'observado');
            const observedTypes = observedDocs.map(d => d.document_type);
            const submittedTypes = Object.keys(newDocuments);

            const missingDocs = observedTypes.filter(t => !submittedTypes.includes(t));

            if (missingDocs.length > 0) {
                throw new Error(`Faltan documentos: ${missingDocs.join(', ')}`);
            }

            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // 🔥 PASO 1: Guardar historial del documento ANTES de reemplazarlo
            for (const doc of observedDocs) {
                const historialId = uuidv4();

                // Guardar referencia al documento antiguo en el historial
                await pool.execute(`
                INSERT INTO t_historial_solicitudes (
                    id_historial,
                    id_solicitud,
                    id_documento,
                    estado_anterior,
                    estado_nuevo,
                    comentario,
                    id_admin,
                    fecha_cambio,
                    file_path_historico  -- ⚠️ Nuevo campo para guardar el path del archivo antiguo
                ) VALUES (?, ?, ?, 'observado', 'pendiente', ?, NULL, NOW(), ?)
            `, [
                    historialId,
                    applicationId,
                    doc.document_id,
                    `Documento reemplazado por corrección`,
                    doc.file_path  // ⚠️ Guardamos el path del archivo antiguo
                ]);
            }

            // 🔥 PASO 2: Reemplazar físicamente los documentos observados
            for (const [docType, file] of Object.entries(newDocuments)) {
                const oldDoc = observedDocs.find(d => d.document_type === docType);

                if (oldDoc) {
                    // Actualizar el documento existente con el nuevo archivo
                    await pool.execute(`
                    UPDATE t_documentos 
                    SET 
                        file_name = ?,
                        file_path = ?,
                        size_kb = ?,
                        upload_date = NOW(),
                        status = 'pendiente',
                        rejection_reason = NULL,
                        updated_at = NOW()
                    WHERE document_id = ?
                `, [
                        file.originalname,
                        file.path,
                        Math.round(file.size / 1024),
                        oldDoc.document_id
                    ]);
                }
            }

            // 🔥 PASO 3: Cambiar el estado de la solicitud a pendiente
            await pool.execute(`
            UPDATE t_solicitudes 
            SET status = 'pendiente', updated_at = NOW()
            WHERE id_solicitud = ?
        `, [applicationId]);

            // 🔥 PASO 4: Registrar en historial general de la solicitud
            const historialId = uuidv4();
            await pool.execute(`
            INSERT INTO t_historial_solicitudes (
                id_historial,
                id_solicitud,
                id_documento,
                estado_anterior,
                estado_nuevo,
                comentario,
                id_admin,
                fecha_cambio
            ) VALUES (?, ?, NULL, 'observado', 'pendiente', ?, ?, NOW())
        `, [
                historialId,
                applicationId,
                `Solicitud reenviada con correcciones en: ${observedTypes.join(', ')}`,
                userId
            ]);

            return {
                success: true,
                applicationId: applicationId,
                message: 'Documentos corregidos enviados exitosamente. Tu solicitud está en revisión.'
            };

        } catch (error) {
            console.error('Error en resubmitWithCorrections:', error);
            throw error;
        }
    }

}



export default new ApplicationService();
