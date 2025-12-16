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
/*
    async getApplicationByDni(dni, applicationType) {
        try {
            if (applicationType === 'estudiante' && dni.length !== 8) {
                throw new Error('DNI de estudiante debe tener 8 dígitos');
            }
            if (applicationType === 'docente' && dni.length !== 6) {
                throw new Error('Código de docente debe tener 6 dígitos');
            }

            const application = await applicationRepository.getApplicationByDni(dni, applicationType);

            if (!application) {
                return null;
            }

            // Obtener imágenes para cada documento
            for (let doc of application.documents) {
                const images = await applicationRepository.getDocumentImages(doc.document_id);
                doc.images = images.map(img => ({
                    url: `/uploads/${img.ruta_imagen}`,
                    filename: img.nombre_archivo
                }));
            }

            return application;
        } catch (error) {
            console.error('Error en getApplicationByDni service:', error);
            throw error;
        }
    }*/

        async savePublicationLink(applicationId, publicationLink) {
        try {
            const result = await applicationRepository.savePublicationLink(applicationId, publicationLink);
            return result;
        } catch (error) {
            console.error('Error en savePublicationLink (service):', error);
            throw error;
        }
    }

}



export default new ApplicationService();
