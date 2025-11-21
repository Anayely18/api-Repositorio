import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import documentRepository from '../repositories/documentRepository.js';

class DocumentService {
    constructor() {
        this.uploadDir = './uploads';
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async createDocument(idApplication, archive, documentType, uploadDate) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const archiveName = archive.originalname || archive.name;
        const sizeKB = Math.round((archive.size || 0) / 1024);

        const fileName = `${id}_${archiveName}`;
        const archiveRoute = path.join(this.uploadDir, fileName);

        const buffer = archive.buffer || archive.data;
        fs.writeFileSync(archiveRoute, buffer);

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
