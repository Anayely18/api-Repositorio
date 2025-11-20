class Application {
    constructor(data) {
        this.id = data.id_solicitud;
        this.applicationType = data.tipo_solicitud;
        this.name = data.nombres;
        this.surname = data.apellidos;
        this.dni = data.dni;
        this.contactNumber = data.numero_contacto;
        this.professionalSchool = data.escuela_profesional;
        this.acceptTerms = data.acepta_terminos;
        this.ajustedFormat = data.formato_ajustado;
        this.errorsRead = data.errores_leidos;
        this.informedProcedure = data.tramite_informado;
        this.projectName = data.nombre_proyecto;
        this.observations = data.observaciones;
        this.linkToPublishedTesis = data.link_tesis_publicada;
        this.status = data.estado;
        this.applicationDate = data.fecha_solicitud;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toDatabase() {
        return {
            id_solicitud: this.id,
            tipo_solicitud: this.applicationType,
            nombres: this.name,
            apellidos: this.surname,
            dni: this.dni,
            numero_contacto: this.contactNumber,
            escuela_profesional: this.professionalSchool,
            acepta_terminos: this.acceptTerms,
            formato_ajustado: this.ajustedFormat,
            errores_leidos: this.errorsRead,
            tramite_informado: this.informedProcedure,
            nombre_proyecto: this.projectName,
            observaciones: this.observations,
            link_tesis_publicada: this.linkToPublishedTesis,
            estado: this.status,
            fecha_solicitud: this.applicationDate,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            applicationType: this.applicationType,
            name: this.name,
            surname: this.surname,
            dni: this.dni,
            contactNumber: this.contactNumber,
            professionalSchool: this.professionalSchool,
            acceptTerms: this.acceptTerms,
            ajustedFormat: this.ajustedFormat,
            errorsRead: this.errorsRead,
            informedProcedure: this.informedProcedure,
            projectName: this.projectName,
            observations: this.observations,
            linkToPublishedTesis: this.linkToPublishedTesis,
            status: this.status,
            applicationDate: this.applicationDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default Application;