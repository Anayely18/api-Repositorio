class Document {
    constructor(data) {
        this.id = data.id_documento;
        this.idApplication = data.id_solicitud;
        this.documentType = data.tipo_documento;
        this.archiveName = data.nombre_archivo;
        this.archiveRoute = data.ruta_archivo;
        this.sizeKB = data.tamano_kb;
        this.uploadDate = data.fecha_subida;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }
    
    toDatabase() {
        return {
            id_documento: this.id,
            id_solicitud: this.idApplication,
            tipo_documento: this.documentType,
            nombre_archivo: this.archiveName,
            ruta_archivo: this.archiveRoute,
            tamano_kb: this.sizeKB,
            fecha_subida: this.uploadDate,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            idApplication: this.idApplication,
            documentType: this.documentType,
            archiveName: this.archiveName,
            archiveRoute: this.archiveRoute,
            sizeKB: this.sizeKB,
            uploadDate: this.uploadDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default Document;
