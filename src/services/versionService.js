import applicationRepository from '../repositories/applicationRepository.js';
import documentRepository from '../repositories/documentRepository.js';
import { v4 as uuidv4 } from 'uuid';

class VersionService {
    async resubmitWithCorrections(applicationId, newDocuments, userId) {
        const original = await applicationRepository.getDocumentsWithApplicationDetails(applicationId);

        if (!original) throw new Error('Solicitud original no encontrada');
        if (original.status !== 'observado') throw new Error('Solo se pueden reenviar solicitudes observadas');

        const observedDocs = original.documents.filter(d => d.status === 'observado');
        if (observedDocs.length === 0) throw new Error('No hay documentos observados para corregir');

        const observedTypes = observedDocs.map(d => d.document_type);
        const submittedTypes = Object.keys(newDocuments);
        const missing = observedTypes.filter(t => !submittedTypes.includes(t));
        if (missing.length > 0) {
            throw new Error(`Faltan documentos observados: ${missing.join(', ')}`);
        }

        // Crear nueva versión
        const { newId, version } = await applicationRepository.createApplicationVersion(
            applicationId,
            {
                newDocuments: observedTypes.map(type => ({
                    documentType: type,
                    file: newDocuments[type]
                })),
                motivoReenvio: 'Corrección de documentos observados'
            }
        );

        return {
            success: true,
            newApplicationId: newId,
            version
        };
    }
}

export default new VersionService();
