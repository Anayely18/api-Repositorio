import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import documentRepository from '../repositories/documentRepository.js';

class DocumentService {
    async createDocument(idApplication, archive, documentType, uploadDate) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const archiveName = archive.originalname || archive.name;
        const sizeKB = Math.round((archive.size || 0) / 1024);

        // La ruta ya viene desde multer, así que no necesitamos volver a mover el archivo
        const archiveRoute = archive.path;

        const document = await documentRepository.create(
            id,
            idApplication,
            documentType,
            archiveName,
            archiveRoute,
            sizeKB,
            uploadDate,
            createdAt,
            updatedAt
        );

        return { document };
    }
}

export default new DocumentService();

