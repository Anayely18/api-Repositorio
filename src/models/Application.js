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

        this.searchAuthors = data.autores_busqueda;
    }

    toDatabase() {
        const json = {
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

        if (this.email) json.email = this.email;
        if (this.financingType) json.financingType = this.financingType;
        if (this.declaresTruth !== undefined) json.declaresTruth = this.declaresTruth;
        if (this.searchAuthors) json.searchAuthors = this.searchAuthors;

        return json;
    }

    toListJSON() {
        return {
            id: this.id,
            applicationType: this.applicationType,
            name: this.name,
            surname: this.surname,
            dni: this.dni,
            professionalSchool: this.professionalSchool,
            projectName: this.projectName,
            status: this.status,
            applicationDate: this.applicationDate,
            observations: this.observations,
            searchAuthors: this.searchAuthors,
            applicationDate: this.applicationDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
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
